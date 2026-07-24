import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTranslations20260724143000 implements MigrationInterface {
  name = 'CreateTranslations20260724143000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS translation_namespaces (
        id varchar(36) NOT NULL,
        scope varchar(40) NOT NULL DEFAULT 'platform',
        ownerKey varchar(120) NOT NULL DEFAULT 'global',
        \`key\` varchar(120) NOT NULL,
        name varchar(180) NOT NULL,
        description text NULL,
        active tinyint NOT NULL DEFAULT 1,
        isPublic tinyint NOT NULL DEFAULT 1,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE KEY IDX_translation_namespaces_scope_owner_key (scope, ownerKey, \`key\`),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS translation_entries (
        id varchar(36) NOT NULL,
        scope varchar(40) NOT NULL DEFAULT 'platform',
        ownerKey varchar(120) NOT NULL DEFAULT 'global',
        namespace varchar(120) NOT NULL,
        locale varchar(12) NOT NULL,
        \`key\` varchar(220) NOT NULL,
        value text NOT NULL,
        fallbackValue text NULL,
        source varchar(40) NOT NULL DEFAULT 'seed',
        active tinyint NOT NULL DEFAULT 1,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE KEY IDX_translation_entries_unique_key (scope, ownerKey, namespace, locale, \`key\`),
        KEY IDX_translation_entries_bundle (scope, ownerKey, namespace, locale),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS translation_bundle_versions (
        id varchar(36) NOT NULL,
        scope varchar(40) NOT NULL DEFAULT 'platform',
        ownerKey varchar(120) NOT NULL DEFAULT 'global',
        namespace varchar(120) NOT NULL,
        locale varchar(12) NOT NULL,
        version varchar(80) NOT NULL,
        hash varchar(80) NOT NULL,
        entries json NOT NULL,
        active tinyint NOT NULL DEFAULT 1,
        publishedAt datetime NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE KEY IDX_translation_bundle_versions_unique (scope, ownerKey, namespace, locale, version),
        KEY IDX_translation_bundle_versions_active (scope, ownerKey, namespace, locale, active),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS translation_missing_keys (
        id varchar(36) NOT NULL,
        scope varchar(40) NOT NULL DEFAULT 'platform',
        ownerKey varchar(120) NOT NULL DEFAULT 'global',
        namespace varchar(120) NOT NULL,
        locale varchar(12) NOT NULL,
        \`key\` varchar(220) NOT NULL,
        route varchar(220) NULL,
        context json NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        KEY IDX_translation_missing_keys_lookup (scope, ownerKey, namespace, locale, \`key\`),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS translation_missing_keys');
    await queryRunner.query('DROP TABLE IF EXISTS translation_bundle_versions');
    await queryRunner.query('DROP TABLE IF EXISTS translation_entries');
    await queryRunner.query('DROP TABLE IF EXISTS translation_namespaces');
  }
}
