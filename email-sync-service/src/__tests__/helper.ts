import { faker } from '@faker-js/faker';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import { format } from 'prettier';
import textversionjs from 'textversionjs';
import {
  DbPropValue,
  Email,
  EmailAttachment,
  EmailAttachmentData,
  GmailMessage,
  GmailMessageBody,
  GmailMessageHeader,
  GmailMessagePart,
  GmailMessagePayload,
  NotionPropertyType,
} from '../types';

export const createDbPropValue = (propType: NotionPropertyType, propVal?: string): DbPropValue => {
  return {
    propType,
    propName: propType.toString() + '-name',
    propValue: propVal ?? propType.toString() + '-value',
  };
};

export const formatStmt = (str: string, parser?: string) => format(str, { parser: parser ?? 'html' });

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
    gmailMeta: {
      historyId: email?.gmailMeta.historyId ?? faker.string.numeric(8),
      internalDate: email?.gmailMeta.internalDate ?? new Date().getTime(),
      threadId: email?.gmailMeta.threadId ?? faker.string.alphanumeric({ length: 16 }),
    },
    hash: email?.hash ?? faker.string.alphanumeric({ length: 16 }),
    labelIds: email?.labelIds ?? createGmailLabels(),
    textHtml: html,
    textPlain: textify(html),
    linkToPdf: 'http://example/link',
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
  } = { content: '', attachmentFilenames: [], message: {} },
): GmailMessage => {
  const { content, attachmentFilenames, message } = args;

  let htmlContent = content;
  if (!content) {
    htmlContent = createSampleHtml();
  }

  const attachments: any = [];
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
    snippet:
      message?.snippet ??
      textify(htmlContent ?? '')
        .replace('\n', '')
        .trim()
        .slice(0, 60),
  };
};

export const createSampleAttachmentData = (): EmailAttachmentData => {
  return {
    payload:
      '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',
    size: 19321,
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
      cid,
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
    parts: createMessagePayloadParts(htmlContent ?? '', attachments),
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

const nhm = new NodeHtmlMarkdown(
  /* options (optional) */ {},
  /* customTransformers (optional) */ undefined,
  /* customCodeBlockTranslators (optional) */ undefined,
);

export const markdownify = (htmlStr: string): string => {
  let markdown = htmlStr;

  markdown = fixHrefs(markdown);
  markdown = nhm.translate(markdown);
  markdown = parseHtmlEntities(markdown);

  return markdown;
};

const getEmbeddedAttachmentIds = (htmlStr: string): string[] => {
  const matches = htmlStr.match(/cid:[^"]+/gi);
  return matches?.map(match => match.replace('cid:', '')) ?? [];
};
