import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter } from "@bull-board/fastify";

import {
  createGoogleContactQueue,
  excludeGoogleContactQueue,
  updateGoogleContactQueue,
} from "../worker/services/google";
import {
  createNotionContactQueue,
  createNotionTagQueue,
  excludeNotionContactQueue,
  excludeNotionTagQueue,
  updateNotionContactQueue,
  updateNotionTagQueue,
} from "../worker/services/notion";

export const serverAdapter = new FastifyAdapter();

serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [
    new BullMQAdapter(createGoogleContactQueue),
    new BullMQAdapter(updateGoogleContactQueue),
    new BullMQAdapter(excludeGoogleContactQueue),
    new BullMQAdapter(createNotionTagQueue),
    new BullMQAdapter(excludeNotionTagQueue),
    new BullMQAdapter(updateNotionTagQueue),
    new BullMQAdapter(createNotionContactQueue),
    new BullMQAdapter(excludeNotionContactQueue),
    new BullMQAdapter(updateNotionContactQueue),
  ],
  serverAdapter: serverAdapter,
});
