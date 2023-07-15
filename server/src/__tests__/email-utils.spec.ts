import { faker } from '@faker-js/faker';
import { describe, expect, test } from '@jest/globals';
import { addLinksToMarkdown, parseGmailMessage } from '../email-utils';
import { AttachmentLink } from '../types';
import {
  createContainer,
  createGmailMessage,
  createImg,
  createLineBreak,
  createParagraph,
  createSampleHtml,
  formatStmt,
  markdownify,
} from './test-utils';

describe('Parse Gmail Message', () => {
  test('can parse email metadata successfully', () => {
    const gmailMessage = createGmailMessage({
      message: {
        id: 'id',
        threadId: 'threadId',
        labelIds: ['Label_1', 'Label_2'],
        snippet: 'Test snippet of text',
        historyId: 'historyId',
        internalDate: '1688902332920',
      },
    });

    const parsedEmail = parseGmailMessage(gmailMessage);

    console.log(JSON.stringify(parsedEmail, null, 2));

    expect(parsedEmail.id).toBe('id');
    expect(parsedEmail.gmailMeta.threadId).toBe('threadId');
    expect(parsedEmail.labelIds).toStrictEqual(['Label_1', 'Label_2']);
    expect(parsedEmail.snippet).toBe('Test snippet of text');
    expect(parsedEmail.gmailMeta.historyId).toBe('historyId');
    expect(parsedEmail.gmailMeta.internalDate).toBe(1688902332920);
  });

  test('can parse plain text content', () => {
    const gmailMessage = createGmailMessage({
      content: 'Simple text content',
    });
    const parsedEmail = parseGmailMessage(gmailMessage);
    expect(parsedEmail.textPlain).toBe('Simple text content');
  });

  test('can parse html content', () => {
    const expectedHtml = createSampleHtml();
    const gmailMessage = createGmailMessage({
      content: expectedHtml,
    });
    const parsedEmail = parseGmailMessage(gmailMessage);
    expect(formatStmt(parsedEmail.textHtml)).toBe(formatStmt(expectedHtml));
  });

  test('can produce mardown content', () => {
    const html = createSampleHtml();
    const markdown = markdownify(html);
    const gmailMessage = createGmailMessage({
      content: html,
    });
    const parsedEmail = parseGmailMessage(gmailMessage);
    expect(formatStmt(parsedEmail.textMarkdown, 'markdown')).toBe(formatStmt(markdown, 'markdown'));
  });

  test('can parse email headers', () => {
    const to = faker.internet.email();
    const from = faker.internet.email();
    const subject = faker.lorem.sentence();
    const date = new Date().toUTCString();

    const gmailMessage = createGmailMessage({
      message: {
        payload: {
          headers: [
            {
              name: 'To',
              value: to,
            },
            {
              name: 'From',
              value: from,
            },
            {
              name: 'Subject',
              value: subject,
            },
            {
              name: 'Date',
              value: date,
            },
          ],
        },
      },
    });

    const parsedEmail = parseGmailMessage(gmailMessage);

    expect(parsedEmail.headers.to).toBe(to);
    expect(parsedEmail.headers.from).toBe(from);
    expect(parsedEmail.headers.subject).toBe(subject);
    expect(parsedEmail.headers.date).toBe(date);
  });

  test('can parse embedded and non-embedded attachments', () => {
    const gmailMessage = createGmailMessage({
      content: `${createContainer(
        createParagraph('Content with an embedded and non-embedded attachments') +
          createLineBreak() +
          createImg('contentid123', 'embedded.png'),
      )}`,
      attachmentFilenames: ['attach1.png', 'hello.txt'],
    });

    const parsedEmail = parseGmailMessage(gmailMessage);

    expect(parsedEmail.attachments.length).toBe(3);

    let attachment = parsedEmail.attachments[0];
    expect(attachment).toBeDefined();
    expect(attachment.filename).toBe('attach1.png');
    expect(attachment.attachmentId).toBeDefined();
    expect(attachment.mimeType).toBeDefined();
    expect(attachment.headers['content-id']).toBeDefined();
    expect(attachment.headers['x-attachment-id']).toBeDefined();

    attachment = parsedEmail.attachments[1];
    expect(attachment).toBeDefined();
    expect(attachment.filename).toBe('hello.txt');
    expect(attachment.attachmentId).toBeDefined();
    expect(attachment.mimeType).toBeDefined();
    expect(attachment.headers['content-id']).toBeDefined();
    expect(attachment.headers['x-attachment-id']).toBeDefined();

    attachment = parsedEmail.attachments[2];
    expect(attachment).toBeDefined();
    expect(attachment.filename).toBeDefined();
    expect(attachment.attachmentId).toBeDefined();
    expect(attachment.mimeType).toBeDefined();
    expect(attachment.headers['content-id']).toBe('<contentid123>');
    expect(attachment.headers['x-attachment-id']).toBe('contentid123');
  });
});

describe('Add Links to Markdown', () => {
  test('replaces embedded links', () => {
    const markdown = 'This is some ![embedded.png](cid:abc123) attachment link\nHello!';
    const attachmentLinks: AttachmentLink[] = [
      {
        filename: 'embedded.png',
        url: 'https://some.url',
        cid: 'abc123',
      },
      {
        filename: 'non-embedded.png',
        url: 'https://some.other/url',
        cid: '',
      },
    ];

    const updatedMarkdown = addLinksToMarkdown(attachmentLinks, markdown);

    expect(updatedMarkdown).toStrictEqual(
      'This is some ![embedded.png](https://some.url) attachment link\nHello!\n[non-embedded.png](https://some.other/url)',
    );
  });
});
