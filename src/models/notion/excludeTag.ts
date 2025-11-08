import databaseContactPromise from "../../db/contact";

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

