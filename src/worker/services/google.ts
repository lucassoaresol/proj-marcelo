import { Queue, Worker } from "bullmq";
import { createContact } from "../../models/google/createContact";
import { IContactRecord } from "../../models/google/types";
import { updateContact } from "../../models/google/updateContact";
import { excludeContact } from "../../models/google/excludeContact";


export const createGoogleContactQueue = new Queue<IContactRecord>("create-google-contact", {
  connection: {},
  prefix: "contact",
});

export const createGoogleContactWorker = new Worker<IContactRecord>(
  "create-google-contact",
  async (job) => {
    await createContact(job.data)
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "contact",
  },
);

export const updateGoogleContactQueue = new Queue<IContactRecord>("update-google-contact", {
  connection: {},
  prefix: "contact",
});

export const updateGoogleContactWorker = new Worker<IContactRecord>(
  "update-google-contact",
  async (job) => {
    await updateContact(job.data)
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "contact",
  },
);

export const excludeGoogleContactQueue = new Queue<string>("exclude-google-contact", {
  connection: {},
  prefix: "contact",
});

export const excludeGoogleContactWorker = new Worker<string>(
  "exclude-google-contact",
  async (job) => {
    await excludeContact(job.data)
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "contact",
  },
);
