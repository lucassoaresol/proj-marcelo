-- up
CREATE TABLE "contacts" (
  "id" SERIAL PRIMARY KEY,
  "resource_name" TEXT UNIQUE,
  "data" JSONB,
  "status" TEXT,
  "remarks" TEXT,
  "data_initial" TEXT,
  "notes" TEXT,
  "notion_id" TEXT UNIQUE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_notion_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- down
DROP TABLE IF EXISTS "contacts";
