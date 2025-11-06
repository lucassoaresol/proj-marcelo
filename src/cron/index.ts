import { CronJob } from "cron";

import { runShellScript } from "../utils/runShellScript";

import { syncGoogleContacts } from "./syncGoogleContacts";

CronJob.from({
  cronTime: "0 0 * * *",
  onTick: () => {
    const dirs = ["logs"];
    dirs.forEach((el) =>
      runShellScript(`find ${el} -type f -mtime +5 -exec rm {} \\;`),
    );
  },
  start: true,
});

CronJob.from({
  cronTime: "*/2 * * * *",
  onTick: async () => {
    await syncGoogleContacts();
  },
  start: true,
});
