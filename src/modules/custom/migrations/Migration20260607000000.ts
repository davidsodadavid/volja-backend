import { Migration } from '@mikro-orm/migrations'

export class Migration20260607000000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "custom" add column "state" text not null default 'SHOP' check ("state" in ('IN_PROGRESS', 'PREORDER', 'SHOP', 'ARCHIVE'));`)
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "custom" drop column "state";`)
  }

}
