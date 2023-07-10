import { EnvType, load } from 'ts-dotenv';

export type Env = EnvType<typeof schema>;

export const schema = {
  PORT: Number,
  GMAIL_API_CLIENT_ID: String,
  GMAIL_API_CLIENT_SECRET: String,
  GMAIL_API_REFRESH_TOKEN: String,
  NOTION_API_TOKEN: String,
  NOTION_API_EMAILS_DB_ID: String,
};

export let env: Env;

export function loadEnv(): void {
  env = load(schema);
}
