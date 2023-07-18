import Handlebars from 'handlebars';
import { sha256 } from 'js-sha256';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import puppeteer from 'puppeteer';
import textversionjs from 'textversionjs';

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
  const converter = new NodeHtmlMarkdown();

  let markdown = htmlStr;

  markdown = fixHrefs(markdown);
  markdown = converter.translate(markdown);
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

export const createHash = (str: string): string => {
  return sha256(str);
};

export const convertHtmlToPdf = async (html: string): Promise<Buffer | null> => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  const template = Handlebars.compile(html, { strict: true });
  const result = template(html);

  await page.setContent(result, {
    waitUntil: 'networkidle0',
  });

  let pdfData: Buffer = null;
  try {
    const d = await page.pdf();
    pdfData = Buffer.from(Object.values(d));
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }

  return pdfData;
};
