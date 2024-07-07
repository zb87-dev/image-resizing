import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialDatabaseSetup1720283634361 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        PRIMARY KEY ("id"))`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "conversion_request" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "fileName" text NOT NULL,
        "fileSize" integer NOT NULL,
        "fileType" text NOT NULL,
        "conversionRequestInfo" jsonb NOT NULL,
        "filePath" text NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        PRIMARY KEY ("id"),
        CONSTRAINT "FK_conversion_request_userId"
          FOREIGN KEY ("userId")
          REFERENCES "user"("id") ON DELETE CASCADE
        )`);

    await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "idx_conversion_request_userId" on "conversion_request" ("userId")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "conversion_task" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "requestId" uuid NOT NULL,
        "conversionRequestInfo" jsonb NOT NULL,
        "status" text NOT NULL,
        "convertedFilePath" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        PRIMARY KEY ("id"),
        CONSTRAINT "FK_conversion_task_userId"
          FOREIGN KEY ("userId")
          REFERENCES "user"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_conversion_task_requestId"
          FOREIGN KEY ("requestId")
          REFERENCES "conversion_request"("id") ON DELETE CASCADE
        )`);

    await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "idx_conversion_task_userId"
        ON "conversion_task" ("userId");
      `);

    await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "idx_conversion_task_requestId"
        ON "conversion_task" ("requestId");
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_conversion_request_userId"`);
    await queryRunner.query(`DROP INDEX "idx_conversion_task_userId"`);
    await queryRunner.query(`DROP INDEX "idx_conversion_task_requestId"`);

    await queryRunner.query(`DROP TABLE "conversion_task"`);
    await queryRunner.query(`DROP TABLE "conversion_request"`);
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
