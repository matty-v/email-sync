import { initGmailClient } from './clients/gmail-client';
import { initGoogleDriveClient } from './clients/google-drive-client';
import { initNotionClient } from './clients/notion-client';
import { syncEmailsWithLabel } from './email-sync-svc';
import { env, loadEnv } from './env';

export const runEmailSync = async (req, res) => {
  loadEnv();
  initGoogleDriveClient();
  initGmailClient();
  initNotionClient();

  console.log('📧 Running the email sync service...');
  await syncEmailsWithLabel(env.GMAIL_SYNC_LABEL);
  console.log('✅ Completed email sync!');

  if (res) {
    res.send('Done');
  }
};
