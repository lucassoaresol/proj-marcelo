import { writeFile } from "fs/promises";

import { json2csv } from "json-2-csv";

import { env } from "../config/env";
import databaseContactPromise from "../db/contact";
import dayLib from "../libs/dayjs";
import transporter from "../libs/mailer";

export async function backupContactsAndSendEmail() {
  const formattedDate = dayLib().format("DD-MM-YYYY");
  const db = await databaseContactPromise;

  const contacts = await db.findMany<{ data: any }>({
    table: "contacts",
    select: { data: true },
  });

  const data = contacts.map((el) => el.data);

  const csv = json2csv(data);

  const filename = `BKP_contacts_${formattedDate}.csv`;

  await writeFile(`public/${filename}`, csv, "utf8");

  const mailOptions = {
    from: "lucassoaressq@gmail.com",
    to: env.adminEmailGoogle,
    subject: `📦 Backup de contatos - ${formattedDate}`,
    text: `Olá!

Segue em anexo o backup automático dos contatos gerado em ${formattedDate}.`,
    attachments: [
      {
        filename,
        path: `public/${filename}`,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
}
