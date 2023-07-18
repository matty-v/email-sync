import { env } from '../env';
import { AttachmentLink, DbPropValue, Email, GmailMessage, GmailMessageHeader, NotionPropertyType } from '../types';
import { createHash, decode, markdownify, stripStyleTagsFromHtml } from './utils';

export const getEmailDatabaseId = (): string => {
  return env.NOTION_API_EMAILS_DB_ID;
};

export const getAttachmentsFolderId = () => {
  return env.DRIVE_EMAIL_ATTACHMENTS_FOLDER_ID;
};

export const getMessagesFolderId = () => {
  return env.DRIVE_EMAIL_MESSAGES_FOLDER_ID;
};

export const parseGmailMessage = (gmailMessage: GmailMessage): Email => {
  let email: Email = {
    id: '',
    gmailMeta: {
      historyId: '',
      internalDate: -1,
      threadId: '',
    },
    hash: '',
    labelIds: [],
    snippet: '',
    headers: {},
    attachments: [],
    textHtml: '',
    textMarkdown: '',
    linkToPdf: '',
    textPlain: '',
  };

  if (!gmailMessage) return email;

  email.id = gmailMessage.id;
  email.gmailMeta = {
    historyId: gmailMessage.historyId,
    threadId: gmailMessage.threadId,
    internalDate: gmailMessage.internalDate ? parseInt(gmailMessage.internalDate) : -1,
  };
  email.snippet = gmailMessage.snippet;
  email.labelIds = gmailMessage.labelIds;

  const payload = gmailMessage.payload;
  if (!payload) {
    return email;
  }

  const createHeaders = (headers: GmailMessageHeader[]): { [key: string]: string } => {
    if (!headers) {
      return {};
    } else {
      return headers.reduce(function (result, header) {
        result[header.name.toLowerCase()] = header.value;
        return result;
      }, {});
    }
  };

  email.headers = createHeaders(payload.headers);

  let parts = [payload];
  let firstPartProcessed = false;

  let headers: { [key: string]: string };
  while (parts.length !== 0) {
    const part = parts.shift();
    if (part.parts) {
      parts = parts.concat(part.parts);
    }
    if (firstPartProcessed) {
      headers = createHeaders(part.headers);
    }

    if (!part.body) {
      continue;
    }

    const isHtml = part.mimeType && part.mimeType.indexOf('text/html') !== -1;
    const isPlain = part.mimeType && part.mimeType.indexOf('text/plain') !== -1;
    const isAttachment = Boolean(
      part.body.attachmentId ||
        (headers &&
          headers['content-disposition'] &&
          headers['content-disposition'].toLowerCase().indexOf('attachment') !== -1),
    );
    if (isHtml && !isAttachment) {
      email.hash = createHash(part.body.data);

      const decodedHtml = decode(part.body.data);
      email.textHtml = stripStyleTagsFromHtml(decodedHtml);
      email.textMarkdown = markdownify(decodedHtml);
    } else if (isPlain && !isAttachment) {
      email.textPlain = decode(part.body.data);
    } else if (isAttachment) {
      const body = part.body;
      if (!email.attachments) {
        email.attachments = [];
      }

      const attachmentHeaders = createHeaders(part.headers);

      email.attachments.push({
        filename: part.filename,
        mimeType: part.mimeType,
        size: body.size,
        attachmentId: body.attachmentId,
        headers: attachmentHeaders,
        cid: attachmentHeaders['x-attachment-id'] ?? '',
      });
    }

    firstPartProcessed = true;
  }

  return email;
};

export const addLinksToMarkdown = (links: AttachmentLink[], markdown: string): string => {
  let editedMarkdown = markdown;

  for (let link of links) {
    if (link.cid) {
      const cidRegex = `cid:${link.cid}`;
      var re = new RegExp(cidRegex, 'gm');
      const embeddedMatch = markdown.match(re);

      if (embeddedMatch && embeddedMatch.length > 0 && embeddedMatch[0]) {
        editedMarkdown = editedMarkdown.replace(embeddedMatch[0], link.url);
      } else {
        editedMarkdown += `\n[${link.filename}](${link.url})`;
      }
    } else {
      editedMarkdown += `\n[${link.filename}](${link.url})`;
    }
  }

  return editedMarkdown;
};

export const createEmailDbPropValues = (email: Email): DbPropValue[] => {
  return [
    {
      propName: 'From',
      propType: NotionPropertyType.rich_text,
      propValue: email.headers['from'],
    },
    {
      propName: 'To',
      propType: NotionPropertyType.rich_text,
      propValue: email.headers['to'],
    },
    {
      propName: 'Date',
      propType: NotionPropertyType.date,
      propValue: email.headers['date'],
    },
    {
      propName: 'Name',
      propType: NotionPropertyType.title,
      propValue: email.headers['subject'],
    },
    {
      propName: 'Original Message',
      propType: NotionPropertyType.url,
      propValue: email.linkToPdf,
    },
    {
      propName: 'Message ID',
      propType: NotionPropertyType.rich_text,
      propValue: email.id,
    },
    {
      propName: 'Hash',
      propType: NotionPropertyType.rich_text,
      propValue: email.hash,
    },
  ];
};
