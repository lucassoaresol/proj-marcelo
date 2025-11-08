import { Queue, Worker } from "bullmq";
import { createContact } from "../../models/notion/createContact";
import { createTag } from "../../models/notion/createTag";
import { excludeContact } from "../../models/notion/excludeContact";
import { excludeTag } from "../../models/notion/excludeTag";
import { updateContact } from "../../models/notion/updateContact";
import { updateTag } from "../../models/notion/updateTag";

export const createNotionTagQueue = new Queue<string>("create-notion-tag", {
  connection: {},
  prefix: "contact",
});

export const createNotionTagWorker = new Worker<string>(
  "create-notion-tag",
  async (job) => {
    await createTag(job.data)
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "contact",
  },
);

export const updateNotionTagQueue = new Queue<string>("update-notion-tag", {
  connection: {},
  prefix: "contact",
});

export const updateNotionTagWorker = new Worker<string>(
  "update-notion-tag",
  async (job) => {
    await updateTag(job.data)
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "contact",
  },
);

export const excludeNotionTagQueue = new Queue<string>("exclude-notion-tag", {
  connection: {},
  prefix: "contact",
});

export const excludeNotionTagWorker = new Worker<string>(
  "exclude-notion-tag",
  async (job) => {
    await excludeTag(job.data)
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "contact",
  },
);

export const createNotionContactQueue = new Queue<string>("create-notion-contact", {
  connection: {},
  prefix: "contact",
});

export const createNotionContactWorker = new Worker<string>(
  "create-notion-contact",
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

export const updateNotionContactQueue = new Queue<{ notion_id: string, updated_properties: string[] }>("update-notion-contact", {
  connection: {},
  prefix: "contact",
});

export const updateNotionContactWorker = new Worker<{ notion_id: string, updated_properties: string[] }>(
  "update-notion-contact",
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

export const excludeNotionContactQueue = new Queue<string>("exclude-notion-contact", {
  connection: {},
  prefix: "contact",
});

export const excludeNotionContactWorker = new Worker<string>(
  "exclude-notion-contact",
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




