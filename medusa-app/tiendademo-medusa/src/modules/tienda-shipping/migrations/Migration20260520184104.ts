import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260520184104 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "shipping_zone" drop constraint if exists "shipping_zone_nombre_unique";`);
    this.addSql(`create table if not exists "shipping_zone" ("id" text not null, "nombre" text not null, "x" real not null, "y" real not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "shipping_zone_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_shipping_zone_nombre_unique" ON "shipping_zone" ("nombre") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shipping_zone_deleted_at" ON "shipping_zone" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "shipping_zone" cascade;`);
  }

}
