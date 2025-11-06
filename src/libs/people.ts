import { google } from "googleapis";

import { env } from "../config/env";

const SERVICE_ACCOUNT_FILE = "./service-account.json";
const SCOPES = [
  "https://www.googleapis.com/auth/admin.directory.user.readonly",
  "https://www.googleapis.com/auth/contacts",
];
const ADMIN_EMAIL = env.adminEmailGoogle;
const DOMAIN = env.domainGoogle;

export async function authenticate(subjectEmail: string) {
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_FILE,
    scopes: SCOPES,
    clientOptions: {
      subject: subjectEmail,
    },
  });
  return await auth.getClient();
}

export async function listUsers() {
  const authData = await authenticate(ADMIN_EMAIL);
  const auth = authData as unknown as string;
  const service = google.admin({ version: "directory_v1", auth });

  const res = await service.users.list({
    domain: DOMAIN,
    maxResults: 100,
    orderBy: "email",
  });

  return res.data.users || [];
}
