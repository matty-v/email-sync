import { faker } from '@faker-js/faker';
import textversionjs from 'textversionjs';
import { GmailMessage, GmailMessageHeader, GmailMessagePart, GmailMessagePayload } from '../types';
import { encode, getEmbeddedAttachmentIds } from '../utils';

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

export const createMessagePayload = (
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

export const createMessagePayloadHeaders = (headers?: GmailMessageHeader[]): GmailMessageHeader[] => {
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

export const createMessagePayloadParts = (
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

export const createAttachmentParts = (
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

export const createMessageContentParts = (partPrefix: string, htmlContent: string): GmailMessagePart[] => {
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

export const createGmailLabels = (numberOfLabels: number = 3) => {
  const labels: string[] = [];
  for (let i = 0; i < numberOfLabels; i++) {
    labels.push(faker.word.noun().toLocaleUpperCase());
  }
  return labels;
};

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

export const textify = (htmlStr: string): string => {
  return textversionjs(htmlStr, {
    linkProcess: (href, linkText) => {
      return `${linkText} <${href}>`;
    },
    imgProcess: (src, _) => {
      return `[image: ${src}]`;
    },
  });
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
  return `<ul>${items.reduce((prev, curr) => `${prev}<li>${curr}</li>`, '')}</ul>`;
};

export const createContainer = (contents: string): string => {
  return `<div>${contents}</div>`;
};

export const createImg = (cid?: string, filename?: string): string => {
  return `<img src="cid:${cid ?? faker.string.alphanumeric({ length: 12 })}" alt="${
    filename ?? faker.system.fileName()
  }" width="128" height="128">`;
};
