import { gmail_v1, google } from 'googleapis';
import { Email, EmailAttachmentData, GmailLabel, GmailMessageMetadata } from './types';
const parseMessage = require('gmail-api-parse-message');

export class GmailClient {
  private static _instance: GmailClient;
  private _gmail: gmail_v1.Gmail;

  private constructor() {
    const creds = {
      type: 'authorized_user',
      client_id: process.env.GMAIL_API_CLIENT_ID,
      client_secret: process.env.GMAIL_API_CLIENT_SECRET,
      refresh_token: process.env.GMAIL_API_REFRESH_TOKEN,
    };

    const auth = google.auth.fromJSON(creds) as any;
    this._gmail = google.gmail({ version: 'v1', auth });
  }

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  public fetchAttachmentById = async (messageId: string, attachmentId: string): Promise<EmailAttachmentData> => {
    const res = await this._gmail.users.messages.attachments.get({ userId: 'me', id: attachmentId, messageId });
    return {
      payload: res.data.data.replace(/-/g, '+').replace(/_/g, '/'),
      size: res.data.size,
    };
  };

  public fetchEmailsWithLabel = async (labelName: string): Promise<Email[]> => {
    // Get the label ID
    const labels = await this.fetchLabels();
    const labelId = labels.find(label => label.name === labelName)?.id;
    if (!labelId) {
      console.log(`No label found with name [${labelName}]`);
      return [];
    }

    // Get all messages for that label
    const res = await this._gmail.users.messages.list({ userId: 'me', labelIds: [labelId] });
    const messageMetas: GmailMessageMetadata[] = res.data.messages;
    if (!messageMetas || messageMetas.length === 0) {
      console.log(`No messages exist with label [${labelName}]`);
      return [];
    }

    // Get all message payloads
    const emails: Email[] = [];
    for (let messageMeta of messageMetas) {
      const email = await this.fetchEmailById(messageMeta.id);
      if (email) {
        emails.push(email);
      }
    }

    return emails;
  };

  public fetchEmailById = async (messageId: string): Promise<Email | null> => {
    const res = await this._gmail.users.messages.get({ userId: 'me', id: messageId });
    const message = res.data;
    if (!message) {
      console.log(`No messages exist with id [${messageId}]`);
      return null;
    } else {
      return parseMessage(message) as Email;
    }
  };

  public fetchLabels = async (): Promise<GmailLabel[]> => {
    const res = await this._gmail.users.labels.list({ userId: 'me' });
    const labels = res.data.labels;
    if (!labels || labels.length === 0) {
      console.log('No labels found.');
      return [];
    } else {
      return labels;
    }
  };
}
