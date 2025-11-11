import { CronJob } from "cron";

import { runShellScript } from "../utils/runShellScript";

import { backupContactsAndSendEmail } from "./backupContactsAndSendEmail";
import { syncGoogleContacts } from "./syncGoogleContacts";

CronJob.from({
  cronTime: "0 23 * * *",
  onTick: async () => {
    await backupContactsAndSendEmail();
  },
  start: true,
});

CronJob.from({
  cronTime: "0 0 * * *",
  onTick: () => {
    const dirs = ["logs", "public"];
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
