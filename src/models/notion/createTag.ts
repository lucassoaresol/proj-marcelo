import databaseContactPromise from "../../db/contact";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { mapNotionToTagRecord } from "./mapNotionToTagRecord";

export async function createTag(notion_id: string) {
  const database = await databaseContactPromise

  const tagExistin = await database.findFirst({ table: "tags", where: { notion_id }, select: { "id": true } })

  if (!tagExistin) {
    const result = (await notion.pages.retrieve({ page_id: notion_id })) as any;

    const { tag } = mapNotionToTagRecord(result.properties);

    const tagDataExistin = await database.findFirst({ table: "tags", where: { tag }, select: { "id": true } })

    if (!tagDataExistin) {
      const newTag = await database.insertIntoTable<{ id: number }>({
        table: "tags",
        dataDict: { tag, notion_id },
        select: { id: true },
      });

      if (newTag) {
        const updateNotionTag = (await notion.pages.update({
          page_id: notion_id,
          properties: { ID: { number: newTag.id } },
        })) as any;

        await database.updateIntoTable({
          table: "tags",
          dataDict: {
            updated_at: dayLib(updateNotionTag.last_edited_time).toDate(),
          },
          where: { id: newTag.id },
        });
      }
    } else {
      await notion.pages.update({ page_id: notion_id, in_trash: true })
    }
  }
}
