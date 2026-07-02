import dataSource from './data-source';

async function migrate() {
  await dataSource.initialize();
  try {
    const migrations = await dataSource.runMigrations({ transaction: 'each' });
    if (migrations.length) {
      console.log(`Applied ${migrations.length} migration(s): ${migrations.map((item) => item.name).join(', ')}`);
    } else {
      console.log('Database schema is up to date');
    }
  } finally {
    await dataSource.destroy();
  }
}

migrate().catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : error);
  process.exitCode = 1;
});
