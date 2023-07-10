import textversionjs from 'textversionjs';
import { env } from './env';
import { fetchAttachmentById, fetchEmailById, fetchEmailsWithLabelId, fetchLabels } from './gmail-client';
import { createPageInDatabase, formatPropValues } from './notion-client';
import { DbPropValue, Email, EmailAttachmentData, NotionPropertyType } from './types';
import { fixHrefs, parseGmailMessage, parseHtmlEntities } from './utils';

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
  if (!messageMetas || messageMetas.length === 0) {
    console.log(`No messages exist with label [${labelName}]`);
    return [];
  }

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
  return {
    payload: attachment.data.replace(/-/g, '+').replace(/_/g, '/'),
    size: attachment.size,
  };
};

export const syncEmail = async (messageId: string) => {
  const gmailMessage = await fetchEmailById(messageId);
  const email = parseGmailMessage(gmailMessage);

  const propValues: DbPropValue[] = [
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

  const formattedProps = formatPropValues(propValues);
  const emailText = parseHtmlEntities(textversionjs(fixHrefs(email.textHtml)));
  return await createPageInDatabase(env.NOTION_API_EMAILS_DB_ID, formattedProps, emailText);
};
