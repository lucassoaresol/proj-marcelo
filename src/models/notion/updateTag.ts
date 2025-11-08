import databaseContactPromise from "../../db/contact";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { mapNotionToTagRecord } from "./mapNotionToTagRecord";


export async function updateTag(notion_id: string) {
  const db = await databaseContactPromise;

  const tagData = await db.findFirst<{ id: number, updated_at: Date }>({
    table: "tags",
    where: { notion_id },
    select: { id: true, updated_at: true },
  });

  if (tagData) {
    const result = (await notion.pages.retrieve({ page_id: notion_id })) as any;
    const updated_at = result.last_edited_time
    const { tag, contacts } = mapNotionToTagRecord(result.properties);

    if (dayLib(updated_at).diff(tagData.updated_at) > 0) {
      const tagExistin = await db.findFirst<{ notion_id: string }>({ table: "tags", where: { tag }, select: { "notion_id": true } })

      if (tagExistin) {
        for (const contactId of contacts) {
          const contact = await notion.pages.retrieve({ page_id: contactId }) as any;
          const existingRelations: { id: string }[] = contact["properties"]["Tags"]["relation"] || []
          existingRelations.push({ id: tagExistin.notion_id })
          await notion.pages.update({ page_id: contactId, properties: { "Tags": { "relation": existingRelations } } })
        }
        await notion.pages.update({ page_id: notion_id, in_trash: true })
        await db.deleteFromTable({ table: "tags", where: { id: tagData.id } })
      } else {
        await db.updateIntoTable({ table: "tags", dataDict: { tag, updated_at: dayLib(updated_at).toDate() }, where: { id: tagData.id } })
      }
    }
  }
}
