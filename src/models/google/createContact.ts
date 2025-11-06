import { env } from "../../config/env";
import databaseContactPromise from "../../db/contact";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { IContactRecord } from "./types";
import { splitByLastSemicolon, upsertContact } from "./upsertContact";

export async function createContact(data: IContactRecord) {
  const db = await databaseContactPromise;
  const { dataDict, properties } = await upsertContact(data);

  const existiContact = await db.findFirst({
    table: "contacts",
    where: { resource_name: data.resource_name },
    select: { id: true },
  });

  if (!existiContact) {
    const resultNotion = await notion.pages.create({
      parent: { data_source_id: env.dataSourceContact },
      properties: { ...properties, "Concat - Fixa": { rich_text: splitByLastSemicolon(dataDict["Concat - Variável"] || "", 2000).map(part => ({ text: { content: part } })), } },
    });

    const newContact = await db.insertIntoTable<{ id: number }>({
      table: "contacts",
      dataDict: {
        resource_name: data.resource_name,
        data: dataDict,
        updated_at: dayLib(data.updated_at).toDate(),
        notion_id: resultNotion.id,
      },
      select: { id: true },
    });

    if (newContact) {
      const updateNotion = (await notion.pages.update({
        page_id: resultNotion.id,
        properties: { ID: { number: newContact.id } },
      })) as any;

      await db.updateIntoTable({
        table: "contacts",
        dataDict: {
          updated_notion_at: dayLib(updateNotion.last_edited_time).toDate(),
        },
        where: { id: newContact.id },
      });
    }
  }
}
