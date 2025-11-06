import FastifyCors from "@fastify/cors";
import Fastify, { FastifyRequest } from "fastify";

import { env } from "../config/env";
import {
  createNotionContactQueue,
  createNotionTagQueue,
  excludeNotionContactQueue,
  excludeNotionTagQueue,
  updateNotionContactQueue,
  updateNotionTagQueue,
} from "../worker/services/notion";

import { serverAdapter } from "./bull";

const app = Fastify();

app.register(FastifyCors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});
app.register(serverAdapter.registerPlugin(), {
  prefix: "/admin/queues",
});

app.post(
  "/notion",
  async (
    request: FastifyRequest<{
      Body: {
        entity: { id: string };
        type: string;
        data: {
          parent: {
            data_source_id: string;
          };
        };
      };
    }>,
    reply,
  ) => {
    if (
      request.body.type === "page.created" ||
      request.body.type === "page.undeleted"
    ) {
      if (request.body.data.parent.data_source_id === env.dataSourceTag) {
        await createNotionTagQueue.add(
          "save-create-notion-tag",
          request.body.entity.id,
          { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
        );
      }

      if (request.body.data.parent.data_source_id === env.dataSourceContact) {
        await createNotionContactQueue.add(
          "save-create-notion-contact",
          request.body.entity.id,
          { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
        );
      }
    }

    if (request.body.type === "page.properties_updated") {
      if (request.body.data.parent.data_source_id === env.dataSourceTag) {
        await updateNotionTagQueue.add(
          "save-update-notion-tag",
          request.body.entity.id,
          { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
        );
      }

      if (request.body.data.parent.data_source_id === env.dataSourceContact) {
        const requestBody = request.body as any;
        await updateNotionContactQueue.add(
          "save-update-notion-contact",
          {
            notion_id: requestBody.entity.id,
            updated_properties: requestBody.data.updated_properties,
          },
          { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
        );
      }
    }

    if (request.body.type === "page.deleted") {
      if (request.body.data.parent.data_source_id === env.dataSourceTag) {
        await excludeNotionTagQueue.add(
          "save-exclude-notion-tag",
          request.body.entity.id,
          { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
        );
      }

      if (request.body.data.parent.data_source_id === env.dataSourceContact) {
        await excludeNotionContactQueue.add(
          "save-exclude-notion-contact",
          request.body.entity.id,
          { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
        );
      }
    }

    reply.send("OK");
  },
);

export default app;
