import { syncEmailsWithLabel } from './email-sync-svc';
import { env, loadEnv } from './env';
import { initGmailClient } from './gmail-client';
import { initGoogleDriveClient } from './google-drive-client';
import { initNotionClient } from './notion-client';

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
