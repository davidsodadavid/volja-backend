import { Migration } from '@mikro-orm/migrations'

export class Migration20260517000000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "email_subscriber" ("id" text not null, "email" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "email_subscriber_pkey" primary key ("id"));`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_email_subscriber_email" ON "email_subscriber" (email) WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_email_subscriber_deleted_at" ON "email_subscriber" (deleted_at) WHERE deleted_at IS NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "email_subscriber" cascade;`)
  }

}
