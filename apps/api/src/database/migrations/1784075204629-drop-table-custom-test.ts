import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropTableCustomTest1784075204629 implements MigrationInterface {
  name = 'DropTableCustomTest1784075204629';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`custom_test\``);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Restaurar una tabla eliminada requiere una migracion manual con estructura y datos respaldados.
  }
}
