import { google } from "googleapis";
import databaseContactPromise from "../../db/contact";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { authenticate } from "../../libs/people";
import { splitByLastSemicolon } from "../google/upsertContact";
import { mapNotionToContactRecord } from "./mapNotionToContactRecord";

export async function createContact(notion_id: string) {
  const database = await databaseContactPromise;

  const contactExisting = await database.findFirst({ table: "contacts", where: { notion_id }, select: { "id": true } })

  if (!contactExisting) {
    const result = (await notion.pages.retrieve({ page_id: notion_id })) as any;

    const { dataDict, requestBody } = await mapNotionToContactRecord(result.properties);

    const authData = await authenticate("marcelo@mfiuza.com.br");
    const auth = authData as unknown as string;

    const people = google.people({ version: "v1", auth });

    const resultPeople = await people.people.createContact({ requestBody })

    const newContact = await database.insertIntoTable<{ id: number }>({
      table: "contacts", dataDict: {
        resource_name: resultPeople.data.resourceName,
        data: dataDict,
        updated_notion_at: dayLib(result.last_edited_time).toDate(),
        notion_id: notion_id,
      }, select: { "id": true }
    })

    if (newContact) {
      const updateNotionContact = (await notion.pages.update({
        page_id: notion_id,
        properties: { ID: { number: newContact.id }, "Concat - Fixa": { rich_text: splitByLastSemicolon(dataDict["Concat - Variável"] || "", 2000).map(part => ({ text: { content: part } })), }, "Concat - Variável": { rich_text: splitByLastSemicolon(dataDict["Concat - Variável"] || "", 2000).map(part => ({ text: { content: part } })), } },
      })) as any;

      await database.updateIntoTable({
        table: "contacts",
        dataDict: {
          updated_notion_at: dayLib(updateNotionContact.last_edited_time).toDate(),
        },
        where: { id: newContact.id },
      });
    }
  }
}
