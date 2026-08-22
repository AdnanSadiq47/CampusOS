import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './dist/schema/index.js',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'] || 'postgresql://campus_app_user:campus_secure_password@localhost:5432/campus_os_db',
  },
  verbose: true,
  strict: true,
});
