import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropColumnCustomTestNombres1784075183067 implements MigrationInterface {
  name = 'DropColumnCustomTestNombres1784075183067';

  async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('custom_test');
    if (!hasTable) {
      return;
    }

    const hasColumn = await queryRunner.hasColumn('custom_test', 'nombres');
    if (hasColumn) {
      await queryRunner.query(`ALTER TABLE \`custom_test\` DROP COLUMN \`nombres\``);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Reversar este cambio requiere una migracion manual porque puede afectar datos existentes.
  }
}
