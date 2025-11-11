import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  port: z
    .string()
    .default("3000")
    .transform((val) => parseInt(val, 10)),
  envType: z.enum(["linux", "windows"]).default("linux"),
  authNotion: z.string(),
  dataSourceContact: z.uuid(),
  dataSourceTag: z.uuid(),
  adminEmailGoogle: z.email(),
  domainGoogle: z.string(),
  smtpUser: z.email(),
  smtpPass: z.string(),
});

export const env = schema.parse({
  port: process.env.PORT,
  envType: process.env.ENV_TYPE,
  authNotion: process.env.AUTH_NOTION,
  dataSourceContact: process.env.DATA_SOURCE_CONTACT,
  dataSourceTag: process.env.DATA_SOURCE_TAG,
  adminEmailGoogle: process.env.ADMIN_EMAIL_GOOGLE,
  domainGoogle: process.env.DOMAIN_GOOGLE,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
});
