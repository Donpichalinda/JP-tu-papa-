import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260520183921 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_inventory" drop constraint if exists "product_inventory_product_id_unique";`);
    this.addSql(`create table if not exists "product_inventory" ("id" text not null, "product_id" text not null, "nombre" text not null, "precio" integer not null, "stock" integer not null, "sku" text not null default '', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_inventory_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_inventory_product_id_unique" ON "product_inventory" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_inventory_deleted_at" ON "product_inventory" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_inventory" cascade;`);
  }

}
