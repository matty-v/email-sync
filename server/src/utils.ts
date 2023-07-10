import TurndownService from 'turndown';
import { Email, GmailMessage } from './types';

export const parseHtmlEntities = (str: string): string => {
  return str.replace(/&#([0-9]{1,3});/gi, (_, numStr) => {
    var num = parseInt(numStr, 10); // read num as normal number
    return String.fromCharCode(num);
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
      const turndownSvc = new TurndownService();
      result.textMarkdown = turndownSvc.turndown(result.textHtml);
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
