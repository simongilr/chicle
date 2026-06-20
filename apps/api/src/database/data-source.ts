import 'reflect-metadata';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'mariadb',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USER ?? 'chicle',
  password: process.env.DB_PASSWORD ?? 'chicle_secret',
  database: process.env.DB_NAME ?? 'chicle_engine',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false
});
