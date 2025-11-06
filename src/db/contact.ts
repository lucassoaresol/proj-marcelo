import { Database } from "pg-utils";

import getDatabase from "./database";

const databaseContactPromise: Promise<Database> = (async () => {
  return await getDatabase("contact");
})();

export default databaseContactPromise;
