import databaseContactPromise from "../../db/contact";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { NotionRelationProp, NotionText, NotionTitleProp } from "./types";

type Properties = {
  ["Tag"]?: NotionTitleProp
  ["CONTATOS"]?: NotionRelationProp
}

function joinPlainText(chunks?: NotionText[]) {
  if (!chunks?.length) return undefined
  const contents = chunks
    .map(c => c?.text?.content?.trim())
    .filter(Boolean) as string[]
  return contents.length ? contents.join(" ") : undefined
}

export function mapNotionToTagRecord(properties: Properties) {
  const tag =
    joinPlainText(properties?.["Tag"]?.title) ??
    ""
  const contacts = properties?.["CONTATOS"]?.relation?.map(r => r.id) ?? []

  return { tag: tag.toUpperCase(), contacts }
}

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

export async function excludeTag(notion_id: string) {
  const db = await databaseContactPromise;

  const tag = await db.findFirst<{ id: number }>({
    table: "tags",
    where: { notion_id },
    select: { id: true },
  });

  if (tag) {
    await db.deleteFromTable({
      table: "tags",
      where: { id: tag.id },
    });
  }
}

