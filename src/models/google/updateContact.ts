import databaseContactPromise from "../../db/contact";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { IContactRecord } from "./types";
import { upsertContact } from "./upsertContact";

export async function updateContact(data: IContactRecord) {
  const db = await databaseContactPromise;

  const contact = await db.findFirst<{
    id: number;
    data: any;
    notion_id: string;
    updated_at: Date;
  }>({
    table: "contacts",
    where: { resource_name: data.resource_name },
    select: {
      id: true,
      data: true,
      notion_id: true,
      updated_at: true,
    },
  });

  if (contact) {
    if (dayLib(data.updated_at).diff(contact.updated_at) > 0) {
      const { dataDict, properties } = await upsertContact(data);

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
        const updateNotion = (await notion.pages.update({
          page_id: contact.notion_id,
          properties,
        })) as any;

        await db.updateIntoTable({
          table: "contacts",
          dataDict: {
            data: dataDict,
            updated_at: dayLib(data.updated_at).toDate(),
            updated_notion_at: dayLib(updateNotion.last_edited_time).toDate(),
          },
          where: { id: contact.id },
        });
      }
    }
  }
}
