import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260520183937 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "promo_code" drop constraint if exists "promo_code_codigo_unique";`);
    this.addSql(`create table if not exists "promo_code" ("id" text not null, "codigo" text not null, "valor" integer not null, "descripcion" text not null default '', "usos_maximos" integer null, "usos_actuales" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "promo_code_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_promo_code_codigo_unique" ON "promo_code" ("codigo") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_promo_code_deleted_at" ON "promo_code" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "promo_code" cascade;`);
  }

}
