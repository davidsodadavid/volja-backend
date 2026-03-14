import { Migration } from '@mikro-orm/migrations'

export class Migration20260314120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "custom" add column "pre_order_date" timestamptz null;`)
    this.addSql(`alter table "custom" drop column "coming_soon";`)
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "custom" add column "coming_soon" boolean not null default false;`)
    this.addSql(`alter table "custom" drop column "pre_order_date";`)
  }

}
