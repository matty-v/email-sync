import textversionjs from 'textversionjs';
import TurndownService from 'turndown';
import {
  BlockType,
  DbPropValue,
  Email,
  GmailMessage,
  NotionParagraphBlock,
  NotionProperties,
  NotionPropertyType,
} from './types';

const turndownSvc = new TurndownService();

export const parseHtmlEntities = (str: string): string => {
  return str.replace(/&#([0-9]{1,3});/gi, (_, numStr) => {
    return String.fromCharCode(parseInt(numStr, 10));
  });
};

export const fixHrefs = (str: string): string => {
  return str.replace(/href=([^\s>]+)/gi, (_, url: string) => {
    if (url.startsWith('"') && url.endsWith('"')) {
      return `href=${url}`;
    } else {
      return `href=\"${url}\"`;
    }
  });
};

export const getEmbeddedAttachmentIds = (htmlStr: string): string[] => {
  const matches = htmlStr.match(/cid:[^"]+/gi);
  return matches?.map(match => match.replace('cid:', '')) ?? [];
};

export const parseGmailMessage = (gmailMessage: GmailMessage): Email => {
  var result: any = {
    id: gmailMessage.id,
    threadId: gmailMessage.threadId,
    labelIds: gmailMessage.labelIds,
    snippet: gmailMessage.snippet,
    historyId: gmailMessage.historyId,
  };
  if (gmailMessage.internalDate) {
    result.internalDate = parseInt(gmailMessage.internalDate);
  }

  var payload = gmailMessage.payload;
  if (!payload) {
    return result;
  }

  var headers = indexHeaders(payload.headers);
  result.headers = headers;

  var parts = [payload];
  var firstPartProcessed = false;

  while (parts.length !== 0) {
    var part = parts.shift();
    if (part.parts) {
      parts = parts.concat(part.parts);
    }
    if (firstPartProcessed) {
      headers = indexHeaders(part.headers);
    }

    if (!part.body) {
      continue;
    }

    var isHtml = part.mimeType && part.mimeType.indexOf('text/html') !== -1;
    var isPlain = part.mimeType && part.mimeType.indexOf('text/plain') !== -1;
    var isAttachment = Boolean(
      part.body.attachmentId ||
        (headers['content-disposition'] && headers['content-disposition'].toLowerCase().indexOf('attachment') !== -1),
    );
    if (isHtml && !isAttachment) {
      result.textHtml = decode(part.body.data);
      result.textMarkdown = markdownify(result.textHtml);
    } else if (isPlain && !isAttachment) {
      result.textPlain = decode(part.body.data);
    } else if (isAttachment) {
      var body = part.body;
      if (!result.attachments) {
        result.attachments = [];
      }
      result.attachments.push({
        filename: part.filename,
        mimeType: part.mimeType,
        size: body.size,
        attachmentId: body.attachmentId,
        headers: indexHeaders(part.headers),
      });
    }

    firstPartProcessed = true;
  }

  return result;
};

export const decode = (str: string): string => {
  if (!str) return '';
  return Buffer.from(str.replace(/\-/g, '+').replace(/\_/g, '/'), 'base64').toString('utf-8').replace(/\s/g, ' ');
};

export const encode = (str: string): string => {
  if (!str) return '';
  return Buffer.from(str.replace(/\s/g, ' '), 'utf-8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
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

export const markdownify = (htmlStr: string): string => {
  return turndownSvc.turndown(htmlStr);
};

export const formatParagraphBlocks = (content: string): NotionParagraphBlock[] | null => {
  if (!content) return null;

  const blocks: NotionParagraphBlock[] = [];

  content.split('\n').forEach(line => {
    if (line.trim()) {
      blocks.push({
        object: 'block',
        type: BlockType.paragraph,
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: line.replace(/[\n\r]/g, ''),
              },
            },
          ],
        },
      });
    }
  });

  return blocks;
};

export const formatPropValues = (propValues: DbPropValue[]): NotionProperties => {
  let propertiesWithValues: any = {};

  propValues.forEach(prop => {
    switch (prop.propType) {
      case NotionPropertyType.title:
        propertiesWithValues[prop.propName] = {
          title: [
            {
              text: {
                content: prop.propValue,
              },
            },
          ],
        };
        break;

      case NotionPropertyType.select:
        propertiesWithValues[prop.propName] = {
          select: {
            name: prop.propValue,
          },
        };

        break;

      case NotionPropertyType.multi_select:
        propertiesWithValues[prop.propName] = {
          multi_select: prop.propValue.split(',').map(v => {
            return { name: v };
          }),
        };

        break;
      case NotionPropertyType.rich_text:
        propertiesWithValues[prop.propName] = {
          rich_text: [
            {
              text: {
                content: prop.propValue,
              },
            },
          ],
        };

        break;

      case NotionPropertyType.url:
        propertiesWithValues[prop.propName] = {
          url: prop.propValue,
        };

        break;

      case NotionPropertyType.number:
        propertiesWithValues[prop.propName] = {
          number: Number.parseInt(prop.propValue),
        };

        break;

      case NotionPropertyType.status:
        propertiesWithValues[prop.propName] = {
          status: {
            name: prop.propValue,
          },
        };

        break;

      case NotionPropertyType.checkbox:
        propertiesWithValues[prop.propName] = {
          checkbox: prop.propValue === 'true' ? true : false,
        };

        break;

      case NotionPropertyType.date:
        const newDate = new Date(prop.propValue);
        const offset = newDate.getTimezoneOffset();
        const d = new Date(newDate.getTime() - offset * 60 * 1000);
        const datePropVal = d.toISOString().split('T')[0];

        propertiesWithValues[prop.propName] = {
          date: {
            start: datePropVal,
            end: null,
            time_zone: null,
          },
        };

        break;

      default:
        break;
    }
  });

  return propertiesWithValues;
};

export const convertEmailToNotionPage = (email: Email): { content: string; properties: NotionProperties } => {
  const content = parseHtmlEntities(textify(fixHrefs(email.textHtml)));
  const properties = formatPropValues(createEmailDbPropValues(email));
  return { content, properties };
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

const indexHeaders = headers => {
  if (!headers) {
    return {};
  } else {
    return headers.reduce(function (result, header) {
      result[header.name.toLowerCase()] = header.value;
      return result;
    }, {});
  }
};
