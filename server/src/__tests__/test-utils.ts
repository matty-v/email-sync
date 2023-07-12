import { faker } from '@faker-js/faker';
import textversionjs from 'textversionjs';
import TurndownService from 'turndown';
import {
  DbPropValue,
  Email,
  EmailAttachment,
  GmailMessage,
  GmailMessageBody,
  GmailMessageHeader,
  GmailMessagePart,
  GmailMessagePayload,
  NotionPropertyType,
} from '../types';

const turndownSvc = new TurndownService({ headingStyle: 'atx' });

export const createDbPropValue = (propType: NotionPropertyType, propVal?: string): DbPropValue => {
  return {
    propType,
    propName: propType.toString() + '-name',
    propValue: propVal ?? propType.toString() + '-value',
  };
};

// Email test utils ============================================

export const createGmailAttachment = (encodedData?: string): GmailMessageBody => {
  return {
    data: encodedData ?? 'SGVsbG8gV29ybGQh',
    size: faker.number.int(),
  };
};

export const createEmail = (email?: Email): Email => {
  const html = email?.textHtml ?? createSampleHtml();

  return {
    id: email?.id ?? faker.string.alphanumeric({ length: 16 }),
    threadId: email?.threadId ?? faker.string.alphanumeric({ length: 16 }),
    labelIds: email?.labelIds ?? createGmailLabels(),
    historyId: email?.historyId ?? faker.string.numeric(8),
    internalDate: email?.internalDate ?? new Date().getTime(),
    textHtml: html,
    textPlain: textify(html),
    textMarkdown: markdownify(html),
    snippet: textify(html).replace('\n', '').trim().slice(0, 60),
    headers: {
      to: email?.headers?.to ?? `${faker.person.fullName()} <${faker.internet.email()}>`,
      from: email?.headers?.from ?? `${faker.person.fullName()} <${faker.internet.email()}>`,
      subject: email?.headers?.subject ?? faker.lorem.sentence(),
      date: email?.headers?.date ?? new Date().toUTCString(),
    },
    attachments: email?.attachments ?? createEmailAttachments(),
  };
};

export const createGmailMessage = (
  args: {
    content?: string;
    attachmentFilenames?: string[];
    message?: GmailMessage;
  } = { content: null, attachmentFilenames: null, message: null },
): GmailMessage => {
  const { content, attachmentFilenames, message } = args;

  let htmlContent = content;
  if (!content) {
    htmlContent = createSampleHtml();
  }

  const attachments = [];
  if (attachmentFilenames) {
    attachments.push(
      ...attachmentFilenames.map(filename => ({ filename, cid: faker.string.alphanumeric({ length: 12 }) })),
    );
  }

  return {
    id: message?.id ?? faker.string.alphanumeric({ length: 16 }),
    threadId: message?.threadId ?? faker.string.alphanumeric({ length: 16 }),
    labelIds: message?.labelIds ?? createGmailLabels(),
    historyId: message?.historyId ?? faker.string.numeric(8),
    internalDate: message?.internalDate ?? new Date().getTime().toString(),
    sizeEstimate: message?.sizeEstimate ?? faker.number.int(),
    payload: createMessagePayload(htmlContent, attachments, message?.payload),
    snippet: message?.snippet ?? textify(htmlContent).replace('\n', '').trim().slice(0, 60),
  };
};

// Email test utils: internal ===================================

const createEmailAttachments = (numAttachments: number = 3): EmailAttachment[] => {
  const attachments: EmailAttachment[] = [];
  for (let i = 0; i < numAttachments; i++) {
    const filename = `${i}-${faker.system.fileName()}`;
    const mimeType = faker.system.mimeType();
    const cid = `${i}-${faker.string.alphanumeric({ length: 10 })}`;

    attachments.push({
      attachmentId: `${i}-${faker.string.uuid()}`,
      filename,
      headers: {
        'content-type': `${mimeType}; name="${filename}"`,
        'content-disposition': `attachment; filename="${filename}"`,
        'content-transfer-encoding': 'base64',
        'x-attachment-id': cid,
        'content-id': `<${cid}>`,
      },
      mimeType,
      size: faker.number.int(),
    });
  }
  return attachments;
};

const createMessagePayload = (
  htmlContent?: string,
  attachments?: { filename: string; cid: string }[],
  payload?: GmailMessagePayload,
): GmailMessagePayload => {
  return {
    filename: payload?.filename ?? faker.system.fileName(),
    mimeType: payload?.mimeType ?? 'multipart/mixed',
    partId: payload?.partId ?? '',
    body: payload?.body ?? { size: faker.number.int() },
    headers: createMessagePayloadHeaders(payload?.headers),
    parts: createMessagePayloadParts(htmlContent, attachments),
  };
};

const createMessagePayloadHeaders = (headers?: GmailMessageHeader[]): GmailMessageHeader[] => {
  const createdHeaders: GmailMessageHeader[] = headers ?? [];
  if (!headers?.find(header => header.name === 'Date')) {
    createdHeaders.push({
      name: 'Date',
      value: new Date().toUTCString(),
    });
  }
  if (!headers?.find(header => header.name === 'Date')) {
    createdHeaders.push({
      name: 'Subject',
      value: faker.lorem.sentence(),
    });
  }
  if (!headers?.find(header => header.name === 'To')) {
    createdHeaders.push({
      name: 'To',
      value: `${faker.person.fullName()} <${faker.internet.email()}>`,
    });
  }
  if (!headers?.find(header => header.name === 'From')) {
    createdHeaders.push({
      name: 'From',
      value: `${faker.person.fullName()} <${faker.internet.email()}>`,
    });
  }
  return createdHeaders;
};

const createRelatedMultipart = (partPrefix: string, relatedParts: GmailMessagePart[]): GmailMessagePart => {
  return {
    partId: `${partPrefix}0`,
    mimeType: 'multipart/related',
    filename: '',
    headers: [
      {
        name: 'Content-Type',
        value: `multipart/related; boundary="${faker.string.alphanumeric({ length: 28 })}"`,
      },
    ],
    body: {
      size: 0,
    },
    parts: relatedParts,
  };
};

const createMessagePayloadParts = (
  htmlContent: string,
  attachments: { filename: string; cid: string }[] = [],
): GmailMessagePart[] => {
  const createdParts: GmailMessagePart[] = [];

  const embeddedAttachmentIds = getEmbeddedAttachmentIds(htmlContent);

  // Attachments and embedded attachments
  if (attachments.length > 0) {
    if (embeddedAttachmentIds.length > 0) {
      createdParts.push(
        createRelatedMultipart('', [
          createRelatedMultipart('0.', createMessageContentParts('0.0.', htmlContent)),
          ...createAttachmentParts(
            '0.',
            embeddedAttachmentIds.map(id => ({ cid: id, filename: faker.system.fileName() })),
          ),
        ]),
        ...createAttachmentParts('', attachments),
      );
    } else {
      createdParts.push(
        createRelatedMultipart('', createMessageContentParts('0.', htmlContent)),
        ...createAttachmentParts('', attachments),
      );
    }
  } else {
    if (embeddedAttachmentIds.length > 0) {
      createdParts.push(
        createRelatedMultipart('', [
          createRelatedMultipart('', createMessageContentParts('0.', htmlContent)),
          ...createAttachmentParts(
            '',
            embeddedAttachmentIds.map(id => ({ cid: id, filename: faker.system.fileName() })),
          ),
        ]),
      );
    } else {
      createdParts.push(...createMessageContentParts('', htmlContent));
    }
  }

  return createdParts;
};

const createAttachmentParts = (
  partPrefix: string,
  attachments: { filename: string; cid: string }[],
): GmailMessagePart[] => {
  const attachmentParts: GmailMessagePart[] = [];
  attachments.forEach((attachment, index) => {
    const mimeType = faker.system.mimeType();
    attachmentParts.push({
      partId: `${partPrefix}${index + 1}`,
      mimeType: mimeType,
      filename: attachment.filename,
      headers: [
        {
          name: 'Content-Type',
          value: `${mimeType}; name="${attachment.filename}"`,
        },
        {
          name: 'Content-Disposition',
          value: `attachment; filename="${attachment.filename}"`,
        },
        {
          name: 'Content-Transfer-Encoding',
          value: 'base64',
        },
        {
          name: 'X-Attachment-Id',
          value: attachment.cid,
        },
        {
          name: 'Content-ID',
          value: `<${attachment.cid}>`,
        },
      ],
      body: {
        attachmentId: faker.string.uuid(),
        size: faker.number.int(),
      },
    });
  });
  return attachmentParts;
};

const createMessageContentParts = (partPrefix: string, htmlContent: string): GmailMessagePart[] => {
  return [
    {
      partId: `${partPrefix}0`,
      mimeType: 'text/plain',
      filename: '',
      headers: [
        {
          name: 'Content-Type',
          value: 'text/plain; charset="UTF-8"',
        },
      ],
      body: {
        size: faker.number.int(),
        data: textify(encode(htmlContent)),
      },
    },
    {
      partId: `${partPrefix}1`,
      mimeType: 'text/html',
      filename: '',
      headers: [
        {
          name: 'Content-Type',
          value: 'text/html; charset="UTF-8"',
        },
        {
          name: 'Content-Transfer-Encoding',
          value: 'quoted-printable',
        },
      ],
      body: {
        size: faker.number.int(),
        data: encode(htmlContent),
      },
    },
  ];
};

const createGmailLabels = (numberOfLabels: number = 3): string[] => {
  const labels: string[] = [];
  for (let i = 0; i < numberOfLabels; i++) {
    labels.push(faker.word.noun().toLocaleUpperCase());
  }
  return labels;
};

// HTML Creation ======================================

export const createSampleHtml = () => {
  let html = '';

  html += createH1();
  html += createParagraph();
  html += createH2();
  html += createParagraph();
  html += createH3();
  html += createParagraph();
  html += createLineBreak();
  html += `${createBoldText()} and ${createUnderlinedText()} and ${createItalicizedText()}`;
  html += createLineBreak();
  html += createLink();
  html += createLineBreak();
  html += createUnorderedList();
  html += createLineBreak();
  html += createImg();
  html = createContainer(html);

  return html;
};

export const createH1 = (text?: string): string => {
  return `<h1>${text ?? faker.lorem.sentence()}</h1>`;
};

export const createH2 = (text?: string): string => {
  return `<h2>${text ?? faker.lorem.sentence()}</h2>`;
};

export const createH3 = (text?: string): string => {
  return `<h3>${text ?? faker.lorem.sentence()}</h3>`;
};

export const createParagraph = (text?: string): string => {
  return `<p>${text ?? faker.lorem.sentence()}</p>`;
};

export const createLineBreak = () => {
  return '<br/>';
};

export const createLink = (linkText?: string, linkSrc?: string): string => {
  return `<a href="${linkSrc ?? faker.internet.url()}">${linkText ?? faker.word.words()}</a>`;
};

export const createBoldText = (text?: string): string => {
  return `<b>${text ?? faker.lorem.sentence()}</b>`;
};

export const createItalicizedText = (text?: string): string => {
  return `<i>${text ?? faker.lorem.sentence()}</i>`;
};

export const createUnderlinedText = (text?: string): string => {
  return `<u>${text ?? faker.lorem.sentence()}</u>`;
};

export const createUnorderedList = (items?: string[]): string => {
  if (!items || items.length === 0) {
    items = [faker.word.noun(), faker.word.noun(), faker.word.noun()];
  }
  return `<ul>${items.reduce((prev, curr) => {
    return `${prev}<li>${curr}</li>`;
  }, '')}</ul>`;
};

export const createContainer = (contents: string): string => {
  return `<div>${contents}</div>`;
};

export const createImg = (cid?: string, filename?: string): string => {
  return `<img src="cid:${cid ?? faker.string.alphanumeric({ length: 12 })}" alt="${
    filename ?? faker.system.fileName()
  }" width="128" height="128">`;
};

// Internal copied utils =========================================
// Note: these may need to be refreshed from the actual utils.ts

const parseHtmlEntities = (str: string): string => {
  return str.replace(/&#([0-9]{1,3});/gi, (_, numStr) => {
    return String.fromCharCode(parseInt(numStr, 10));
  });
};

const fixHrefs = (str: string): string => {
  return str.replace(/href=([^\s>]+)/gi, (_, url: string) => {
    if (url.startsWith('"') && url.endsWith('"')) {
      return `href=${url}`;
    } else {
      return `href=\"${url}\"`;
    }
  });
};

const encode = (str: string): string => {
  if (!str) return '';
  return Buffer.from(str.replace(/\s/g, ' '), 'utf-8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
};

const textify = (htmlStr: string): string => {
  return textversionjs(htmlStr, {
    linkProcess: (href, linkText) => {
      return `${linkText} <${href}>`;
    },
    imgProcess: (src, _) => {
      return `[image: ${src}]`;
    },
  });
};

const markdownify = (htmlStr: string): string => {
  let markdown = htmlStr;

  markdown = fixHrefs(markdown);
  markdown = turndownSvc.turndown(markdown);
  markdown = parseHtmlEntities(markdown);

  return markdown;
};

const getEmbeddedAttachmentIds = (htmlStr: string): string[] => {
  const matches = htmlStr.match(/cid:[^"]+/gi);
  return matches?.map(match => match.replace('cid:', '')) ?? [];
};
