import { google } from "googleapis";
import databaseContactPromise from "../../db/contact";
import { authenticate } from "../../libs/people";

export async function excludeContact(notion_id: string) {
  const database = await databaseContactPromise;

  const contact = await database.findFirst<{ id: number, resource_name: string, }>({
    table: "contacts",
    where: { notion_id },
    select: { id: true, resource_name: true, },
  });

  if (contact) {
    const authData = await authenticate("marcelo@mfiuza.com.br");
    const auth = authData as unknown as string;

    const people = google.people({ version: "v1", auth });

    await people.people.deleteContact({ resourceName: contact.resource_name })

    await database.deleteFromTable({
      table: "contacts",
      where: { id: contact.id },
    });
  }
}
