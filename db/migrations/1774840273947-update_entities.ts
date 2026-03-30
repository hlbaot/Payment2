import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEntities1774840273947 implements MigrationInterface {
    name = 'UpdateEntities1774840273947'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."wallet_transactions_type_enum" AS ENUM('deposit_requested', 'deposit_approved', 'deposit_rejected', 'order_hold', 'order_settled', 'order_refund', 'commission_added')`);
        await queryRunner.query(`CREATE TABLE "wallet_transactions" ("id" SERIAL NOT NULL, "walletId" integer NOT NULL, "userId" integer NOT NULL, "type" "public"."wallet_transactions_type_enum" NOT NULL, "amount" numeric(15,2) NOT NULL, "availableBalanceBefore" numeric(15,2) NOT NULL, "availableBalanceAfter" numeric(15,2) NOT NULL, "holdBalanceBefore" numeric(15,2) NOT NULL, "holdBalanceAfter" numeric(15,2) NOT NULL, "referenceType" character varying(50), "referenceId" integer, "note" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5120f131bde2cda940ec1a621db" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."order_events_status_enum" AS ENUM('pending', 'verifying', 'processing', 'completed', 'cancelled', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "order_events" ("id" SERIAL NOT NULL, "orderId" integer NOT NULL, "status" "public"."order_events_status_enum" NOT NULL, "note" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cc1b82b0fcf1be577d9d7ecbf8b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "support_messages" ADD "type" character varying(50) NOT NULL DEFAULT 'private'`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "commissionRateSnapshot" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "commissionAmount" numeric(15,2)`);
        await queryRunner.query(`CREATE TYPE "public"."orders_commissionstatus_enum" AS ENUM('none', 'pending', 'approved', 'rejected')`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "commissionStatus" "public"."orders_commissionstatus_enum" NOT NULL DEFAULT 'none'`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "commissionReviewedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "commissionRejectReason" text`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "completedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD CONSTRAINT "FK_8a94d9d61a2b05123710b325fbf" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD CONSTRAINT "FK_69454773f1e666a14c6a9539353" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_events" ADD CONSTRAINT "FK_74f8a596c01980f8e99f503c27b" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_events" DROP CONSTRAINT "FK_74f8a596c01980f8e99f503c27b"`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_69454773f1e666a14c6a9539353"`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_8a94d9d61a2b05123710b325fbf"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "completedAt"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "commissionRejectReason"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "commissionReviewedAt"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "commissionStatus"`);
        await queryRunner.query(`DROP TYPE "public"."orders_commissionstatus_enum"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "commissionAmount"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "commissionRateSnapshot"`);
        await queryRunner.query(`ALTER TABLE "support_messages" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TABLE "order_events"`);
        await queryRunner.query(`DROP TYPE "public"."order_events_status_enum"`);
        await queryRunner.query(`DROP TABLE "wallet_transactions"`);
        await queryRunner.query(`DROP TYPE "public"."wallet_transactions_type_enum"`);
    }

}
