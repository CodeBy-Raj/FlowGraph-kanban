import { neon, NeonQueryFunction } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

// Global SQL query helper
export const sql: NeonQueryFunction<false, false> = neon(process.env.DATABASE_URL);
