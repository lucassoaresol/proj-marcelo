import { Client } from "@notionhq/client";

import { env } from "../config/env";

const notion = new Client({
  auth: env.authNotion,
});

export default notion;
