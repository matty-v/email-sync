import { fetchAttachmentById, fetchEmailById, fetchEmailsWithLabelId, fetchLabels } from './gmail-client';
import { createPageInDatabase, getEmailDatabaseId } from './notion-client';
import { DbPropValue, Email, EmailAttachmentData, NotionPageObject, NotionPropertyType } from './types';
import { parseGmailMessage } from './utils';

export const fetchEmailsByLabelName = async (labelName: string): Promise<Email[]> => {
  // Get the label ID
  const labels = await fetchLabels();
  const labelId = labels.find(label => label.name === labelName)?.id;
  if (!labelId) {
    console.log(`No label found with name [${labelName}]`);
    return [];
  }

  // Get all messages for that label
  const messageMetas = await fetchEmailsWithLabelId(labelId);

  // Get all message payloads
  const emails: Email[] = [];
  for (let messageMeta of messageMetas) {
    const email = await fetchEmailById(messageMeta.id);
    if (email) {
      emails.push(parseGmailMessage(email));
    }
  }
  return emails;
};

export const fetchAttachment = async (messageId: string, attachmentId: string): Promise<EmailAttachmentData | null> => {
  if (!messageId || !attachmentId) return null;
  const attachment = await fetchAttachmentById(messageId, attachmentId);
  if (!attachment) return null;
  return {
    payload: attachment.data.replace(/-/g, '+').replace(/_/g, '/'),
    size: attachment.size,
  };
};

export const syncEmail = async (messageId: string): Promise<NotionPageObject | null> => {
  const gmailMessage = await fetchEmailById(messageId);
  if (!gmailMessage) return null;
  const email = parseGmailMessage(gmailMessage);
  return await createPageInDatabase(getEmailDatabaseId(), createEmailDbPropValues(email), email.textMarkdown);
};

const createEmailDbPropValues = (email: Email): DbPropValue[] => {
  return [
    {
      propName: 'From',
      propType: NotionPropertyType.rich_text,
      propValue: email.headers.from,
    },
    {
      propName: 'To',
      propType: NotionPropertyType.rich_text,
      propValue: email.headers.to,
    },
    {
      propName: 'Date',
      propType: NotionPropertyType.date,
      propValue: email.headers.date,
    },
    {
      propName: 'Name',
      propType: NotionPropertyType.title,
      propValue: email.headers.subject,
    },
  ];
};
