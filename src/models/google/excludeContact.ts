import databaseContactPromise from "../../db/contact";
import notion from "../../libs/notion";

export async function excludeContact(resource_name: string) {
  const db = await databaseContactPromise;

  const contact = await db.findFirst<{ id: number; notion_id: string }>({
    table: "contacts",
    where: { resource_name },
    select: { id: true, notion_id: true },
  });

  if (contact) {
    await notion.pages.update({
      page_id: contact.notion_id,
      in_trash: true,
    });

    await db.deleteFromTable({
      table: "contacts",
      where: { id: contact.id },
    });
  }
}
