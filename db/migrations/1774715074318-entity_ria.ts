import { MigrationInterface, QueryRunner } from "typeorm";

export class EntityRia1774715074318 implements MigrationInterface {
    name = 'EntityRia1774715074318'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."support_messages_status_enum" AS ENUM('sent', 'unread', 'read')`);
        await queryRunner.query(`CREATE TABLE "support_messages" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "supporterId" integer NOT NULL, "status" "public"."support_messages_status_enum" NOT NULL DEFAULT 'sent', "messageText" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2aa37479e71ef29cbf4dba2b1a2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."counter_services_category_enum" AS ENUM('transfer', 'payment')`);
        await queryRunner.query(`CREATE TABLE "counter_services" ("id" SERIAL NOT NULL, "counterId" integer NOT NULL, "serviceCode" character varying(50) NOT NULL, "name" character varying(100) NOT NULL, "category" "public"."counter_services_category_enum" NOT NULL, "commissionRate" numeric(10,2) NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_2770a856e6aa9241ffa78c266b3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."counters_status_enum" AS ENUM('open', 'busy', 'full', 'offline')`);
        await queryRunner.query(`CREATE TABLE "counters" ("id" SERIAL NOT NULL, "code" character varying(30) NOT NULL, "name" character varying(100) NOT NULL, "status" "public"."counters_status_enum" NOT NULL DEFAULT 'open', "minAmount" numeric(15,2) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_dfcfd469ec56b02ee73f612577e" UNIQUE ("code"), CONSTRAINT "PK_910bfcbadea9cde6397e0daf996" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('pending', 'verifying', 'processing', 'completed', 'cancelled', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" SERIAL NOT NULL, "orderNo" character varying(50) NOT NULL, "trackingCode" character varying(50), "userId" integer NOT NULL, "counterId" integer NOT NULL, "serviceId" integer NOT NULL, "amount" numeric(15,2) NOT NULL, "totalAmount" numeric(15,2) NOT NULL, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9e116d4adfd60229dc662a81b03" UNIQUE ("orderNo"), CONSTRAINT "UQ_511b33006181ed92b8c9a65138e" UNIQUE ("trackingCode"), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('deposit_created', 'deposit_approved', 'deposit_rejected', 'order_created', 'order_verifying', 'order_processing', 'order_completed', 'order_cancelled', 'order_rejected', 'commission_added', 'refund_added', 'support_reply', 'support_opened', 'support_resolved', 'system_announcement')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "title" character varying(255) NOT NULL, "message" text NOT NULL, "referenceType" character varying(50), "referenceId" integer, "isRead" boolean NOT NULL DEFAULT false, "readAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "fullName" character varying(150) NOT NULL, "email" character varying(150) NOT NULL, "password" character varying NOT NULL, "refreshToken" text, "phoneNumber" character varying(20), "country" character varying(100), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_1e3d0240b49c40521aaeb953293" UNIQUE ("phoneNumber"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."wallets_depositstatus_enum" AS ENUM('none', 'pending', 'processed', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "wallets" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "currency" character(3) NOT NULL DEFAULT 'VND', "availableBalance" numeric(15,2) NOT NULL DEFAULT '0', "holdBalance" numeric(15,2) NOT NULL DEFAULT '0', "pendingDepositAmount" numeric(15,2), "depositStatus" "public"."wallets_depositstatus_enum" NOT NULL DEFAULT 'none', "depositNote" text, "lastDepositRequestedAt" TIMESTAMP, "lastDepositProcessedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_2ecdb33f23e9a6fc392025c0b9" UNIQUE ("userId"), CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_roles" ("user_id" integer NOT NULL, "role_id" integer NOT NULL, CONSTRAINT "PK_23ed6f04fe43066df08379fd034" PRIMARY KEY ("user_id", "role_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_87b8888186ca9769c960e92687" ON "user_roles" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b23c65e50a758245a33ee35fda" ON "user_roles" ("role_id") `);
        await queryRunner.query(`ALTER TABLE "support_messages" ADD CONSTRAINT "FK_a77fbd88d1a6a253abe1f49d663" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "support_messages" ADD CONSTRAINT "FK_071f44d353fa838afbe3efccce9" FOREIGN KEY ("supporterId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "counter_services" ADD CONSTRAINT "FK_142fef3a5a952a985021c04f852" FOREIGN KEY ("counterId") REFERENCES "counters"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_8ec0fd13b879f42a4c96aa3ad2e" FOREIGN KEY ("counterId") REFERENCES "counters"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_7962eb4dc054a83128d4a2fab72" FOREIGN KEY ("serviceId") REFERENCES "counter_services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "FK_2ecdb33f23e9a6fc392025c0b97" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "FK_2ecdb33f23e9a6fc392025c0b97"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_7962eb4dc054a83128d4a2fab72"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_8ec0fd13b879f42a4c96aa3ad2e"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1"`);
        await queryRunner.query(`ALTER TABLE "counter_services" DROP CONSTRAINT "FK_142fef3a5a952a985021c04f852"`);
        await queryRunner.query(`ALTER TABLE "support_messages" DROP CONSTRAINT "FK_071f44d353fa838afbe3efccce9"`);
        await queryRunner.query(`ALTER TABLE "support_messages" DROP CONSTRAINT "FK_a77fbd88d1a6a253abe1f49d663"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b23c65e50a758245a33ee35fda"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_87b8888186ca9769c960e92687"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`DROP TABLE "wallets"`);
        await queryRunner.query(`DROP TYPE "public"."wallets_depositstatus_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
        await queryRunner.query(`DROP TABLE "counters"`);
        await queryRunner.query(`DROP TYPE "public"."counters_status_enum"`);
        await queryRunner.query(`DROP TABLE "counter_services"`);
        await queryRunner.query(`DROP TYPE "public"."counter_services_category_enum"`);
        await queryRunner.query(`DROP TABLE "support_messages"`);
        await queryRunner.query(`DROP TYPE "public"."support_messages_status_enum"`);
    }

}
