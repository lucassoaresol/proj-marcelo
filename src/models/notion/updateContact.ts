import { google } from "googleapis";
import databaseContactPromise from "../../db/contact";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { authenticate } from "../../libs/people";
import { splitByLastSemicolon } from "../google/upsertContact";
import { mapNotionToContactRecord } from "./mapNotionToContactRecord";

export async function updateContact({ notion_id, updated_properties }: { notion_id: string, updated_properties: string[] }) {
  const database = await databaseContactPromise;

  const result = (await notion.pages.retrieve({ page_id: notion_id })) as any;
  const propertiesWithUpdateFlag = Object.fromEntries(
    Object.entries(result.properties).map(([key, value]: [string, any]) => [
      key,
      {
        ...value,
        is_updated: updated_properties.includes(value.id),
      },
    ])
  );
  const updated_notion_at = result.last_edited_time

  const contact = await database.findFirst<{
    id: number; resource_name: string;
    data: any;
    updated_notion_at: Date
  }>({
    table: "contacts",
    where: { notion_id: notion_id },
    select: { id: true, resource_name: true, data: true, updated_notion_at: true, },
  });

  if (contact) {
    if (dayLib(updated_notion_at).diff(contact.updated_notion_at) > 0) {
      const { dataDict, requestBody } = await mapNotionToContactRecord(propertiesWithUpdateFlag);

      let hasChanges = false;

      Object.keys(dataDict).forEach((k) => {
        if (k in contact.data) {
          if ((dataDict as any)[k] !== (contact.data as any)[k]) {
            hasChanges = true;
          }
        } else {
          hasChanges = true;
        }
      });

      if (hasChanges) {
        const authData = await authenticate("marcelo@mfiuza.com.br");
        const auth = authData as unknown as string;

        const people = google.people({ version: "v1", auth });

        const contactRes = await people.people.get({
          resourceName: contact.resource_name,
          personFields: "metadata",
        });

        await people.people.updateContact({
          resourceName: contact.resource_name,
          updatePersonFields: Object.keys(requestBody).join(","),
          requestBody: { ...requestBody, etag: contactRes.data.etag, },
        });

        const updateNotion = (await notion.pages.update({
          page_id: notion_id,
          properties: { "Concat - Variável": { rich_text: splitByLastSemicolon(dataDict["Concat - Variável"] || "", 2000).map(part => ({ text: { content: part } })), } },
        })) as any;

        await database.updateIntoTable({
          table: "contacts", dataDict: { data: dataDict, updated_notion_at: dayLib(updateNotion.last_edited_time).toDate(), }, where: { id: contact.id }
        });
      }
    }
  }
}



