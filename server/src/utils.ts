import { generatePdf } from 'html-pdf-node';
import { sha256 } from 'js-sha256';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import textversionjs from 'textversionjs';

const nhm = new NodeHtmlMarkdown(
  /* options (optional) */ {},
  /* customTransformers (optional) */ undefined,
  /* customCodeBlockTranslators (optional) */ undefined,
);

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
  let markdown = htmlStr;

  markdown = fixHrefs(markdown);
  markdown = nhm.translate(markdown);
  markdown = parseHtmlEntities(markdown);

  return markdown;
};

export const isValidUrl = (url: string): boolean => {
  let testUrl: URL;
  try {
    testUrl = new URL(url);
  } catch (_) {
    return null;
  }

  return testUrl.protocol === 'http:' || testUrl.protocol === 'https:';
};

export const replaceMdImgsWithLinks = (markdown: string): string => {
  return markdown.replace(/(\!\[.*?\]\(.*?\))/gi, (_, link: string) => {
    if (link.startsWith('!')) {
      return link.replace('!', '');
    } else {
      return link;
    }
  });
};

export const stripStyleTagsFromHtml = (html: string): string => {
  return html.replace(/(<style\s.*?<\/style.)/gi, (_, styles: string) => {
    return '';
  });
};

export const shortenString = (str: string, numChars: number): string => {
  if (str.length < numChars) return str;
  return `${str.substring(0, numChars - 3)}...`;
};

export const convertHtmlToPdf = async (html: string): Promise<Buffer | null> => {
  return new Promise<Buffer | null>((resolve, reject) => {
    generatePdf({ content: html }, { format: 'A4' }, (e, buffer) => {
      if (e) {
        console.error(e);
        resolve(null);
      } else {
        resolve(buffer);
      }
    });
  });
};

export const createHash = (str: string): string => {
  return sha256(str);
};
