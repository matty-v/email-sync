import { google } from 'googleapis';
import { env } from './env';
import { GmailLabel, GmailMessage, GmailMessageBody, GmailMessageMetadata } from './types';

let gmailClient;

export const initGmailClient = () => {
  gmailClient = google.gmail({
    version: 'v1',
    auth: google.auth.fromJSON({
      type: 'authorized_user',
      client_id: env.GMAIL_API_CLIENT_ID,
      client_secret: env.GMAIL_API_CLIENT_SECRET,
      refresh_token: env.GMAIL_API_REFRESH_TOKEN,
    }) as any,
  });
};

export const fetchAttachmentById = async (messageId: string, attachmentId: string): Promise<GmailMessageBody> => {
  const res = await gmailClient.users.messages.attachments.get({ userId: 'me', id: attachmentId, messageId });
  return res.data;
};

export const fetchEmailById = async (messageId: string): Promise<GmailMessage | null> => {
  const res = await gmailClient.users.messages.get({ userId: 'me', id: messageId });
  const message = res.data;
  if (!message) {
    console.log(`No messages exist with id [${messageId}]`);
    return null;
  } else {
    return message;
  }
};

export const fetchLabels = async (): Promise<GmailLabel[]> => {
  const res = await gmailClient.users.labels.list({ userId: 'me' });
  const labels = res.data.labels;
  if (!labels || labels.length === 0) {
    console.log('No labels found.');
    return [];
  } else {
    return labels;
  }
};

export const fetchEmailsWithLabelId = async (labelId: string): Promise<GmailMessageMetadata[]> => {
  const res = await gmailClient.users.messages.list({ userId: 'me', labelIds: [labelId] });
  const messageMetas: GmailMessageMetadata[] = res.data.messages;
  if (!messageMetas || messageMetas.length === 0) {
    console.log(`No messages exist with label ID [${labelId}]`);
    return [];
  } else {
    return messageMetas;
  }
};
