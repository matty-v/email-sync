import { addLinksToMarkdown, createEmailDbPropValues, parseGmailMessage } from './email-utils';
import { fetchAttachmentById, fetchEmailById, fetchEmailsWithLabelId, fetchLabels } from './gmail-client';
import {
  fetchFileLinkById,
  getAttachmentsFolderId,
  getMessagesFolderId,
  uploadFileToFolder,
} from './google-drive-client';
import { createPageInDatabase, getEmailDatabaseId } from './notion-client';
import { AttachmentLink, Email, EmailAttachmentData, NotionPageObject } from './types';
import { convertHtmlToPdf, replaceMdImgsWithLinks } from './utils';

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
  // Fetch the email by ID
  const gmailMessage = await fetchEmailById(messageId);
  if (!gmailMessage) return null;

  // Parse it into a usable format
  const email = parseGmailMessage(gmailMessage);

  // Upload a PDF version of the email
  const pdfData = await convertHtmlToPdf(email.textHtml);
  const pdfFileId = await uploadFileToFolder(
    {
      dataBuffer: pdfData,
      filename: `${email.id}-${email.headers.subject}`,
      mimeType: 'application/pdf',
    },
    getMessagesFolderId(),
  );
  const pdfFileUrl = await fetchFileLinkById(pdfFileId);
  email.linkToPdf = pdfFileUrl;

  // Upload the attachments to google drive
  const attachmentLinks: AttachmentLink[] = [];

  if (email.attachments && email.attachments.length > 0) {
    for (let attachment of email.attachments) {
      const attachmentData = await fetchAttachment(email.id, attachment.attachmentId);

      const fileId = await uploadFileToFolder(
        {
          dataBuffer: Buffer.from(attachmentData.payload, 'base64'),
          filename: `${email.id}-${attachment.filename}`,
          mimeType: attachment.mimeType,
        },
        getAttachmentsFolderId(),
      );

      const attachmentUrl = await fetchFileLinkById(fileId);

      attachmentLinks.push({
        filename: attachment.filename,
        url: attachmentUrl,
        cid: attachment.headers['x-attachment-id'] ?? '',
      });
    }
  }

  // Add the attachment URLs as links to the email markdown
  let emailMarkdown = addLinksToMarkdown(attachmentLinks, email.textMarkdown);
  emailMarkdown = replaceMdImgsWithLinks(emailMarkdown);

  // Create the email page in Notion
  const emailPage = await createPageInDatabase(getEmailDatabaseId(), createEmailDbPropValues(email), emailMarkdown);

  return emailPage;
};
