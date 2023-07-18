import { EnvType, load } from 'ts-dotenv';

export type Env = EnvType<typeof schema>;

export const schema = {
  PORT: Number,
  GOOGLE_CLIENT_ID: String,
  GOOGLE_CLIENT_SECRET: String,
  GMAIL_API_REFRESH_TOKEN: String,
  DRIVE_API_REFRESH_TOKEN: String,
  NOTION_API_TOKEN: String,
  NOTION_API_EMAILS_DB_ID: String,
  DRIVE_EMAIL_MESSAGES_FOLDER_ID: String,
  DRIVE_EMAIL_ATTACHMENTS_FOLDER_ID: String,
  GMAIL_SYNC_LABEL: String,
};

export let env: Env;

export function loadEnv(): void {
  env = load(schema);
}
