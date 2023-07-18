import { gmail_v1, google } from 'googleapis';
import { env } from '../env';
import { GmailLabel, GmailMessage, GmailMessageBody, GmailMessageMetadata } from '../types';

let gmailClient: gmail_v1.Gmail;

export const initGmailClient = () => {
  gmailClient = google.gmail({
    version: 'v1',
    auth: google.auth.fromJSON({
      type: 'authorized_user',
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GMAIL_API_REFRESH_TOKEN,
    }) as any,
  });
};

export const fetchAttachmentById = async (
  messageId: string,
  attachmentId: string,
): Promise<GmailMessageBody | null> => {
  let attachment: GmailMessageBody | null = null;
  try {
    const res = await gmailClient.users.messages.attachments.get({ userId: 'me', id: attachmentId, messageId });
    attachment = res.data;
  } catch (e) {
    console.log(`Failed to fetch attachment with message id [${messageId}] and attachment id [${attachmentId}]!`);
    console.error(e);
    return attachment;
  }
  if (!attachment) {
    console.log(`No attachment found with message id [${messageId}] and attachment id [${attachmentId}]!`);
    return null;
  }

  return attachment;
};

export const fetchEmailById = async (messageId: string): Promise<GmailMessage | null> => {
  let message: GmailMessage | null = null;
  try {
    const res = await gmailClient.users.messages.get({ userId: 'me', id: messageId });
    message = res.data;
  } catch (e) {
    console.log(`Failed to fetch email with id [${messageId}]!`);
    console.error(e);
    return message;
  }
  if (!message) {
    console.log(`No messages exist with id [${messageId}]`);
    return null;
  } else {
    return message;
  }
};

export const fetchLabels = async (): Promise<GmailLabel[]> => {
  let labels: GmailLabel[] = [];
  try {
    const res = await gmailClient.users.labels.list({ userId: 'me' });
    labels = res.data.labels;
  } catch (e) {
    console.log('Failed to fetch labels!');
    console.error(e);
    return labels;
  }
  if (!labels || labels.length === 0) {
    console.log('No labels found.');
    return [];
  } else {
    return labels;
  }
};

export const fetchEmailsWithLabelId = async (labelId: string): Promise<GmailMessageMetadata[]> => {
  let messageMetas: GmailMessageMetadata[] = [];
  try {
    const res = await gmailClient.users.messages.list({ userId: 'me', labelIds: [labelId] });
    messageMetas = res.data.messages;
  } catch (e) {
    console.log(`Failed to fetch emails with labelId [${labelId}]!`);
    console.error(e);
    return messageMetas;
  }
  if (!messageMetas || messageMetas.length === 0) {
    console.log(`No messages exist with label ID [${labelId}]`);
    return [];
  } else {
    return messageMetas;
  }
};
