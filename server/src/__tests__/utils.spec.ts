import { faker } from '@faker-js/faker';
import { describe, expect, test } from '@jest/globals';
import { format } from 'prettier';
import TurndownService from 'turndown';
import { BlockType, NotionParagraphBlock, NotionPropertyType } from '../types';
import {
  convertEmailToNotionPage,
  decode,
  encode,
  fixHrefs,
  formatParagraphBlocks,
  formatPropValues,
  parseGmailMessage,
} from '../utils';
import {
  createContainer,
  createDbPropValue,
  createEmail,
  createGmailMessage,
  createH1,
  createImg,
  createLineBreak,
  createLink,
  createParagraph,
  createSampleHtml,
} from './test-utils';

const formatStmt = (str: string, parser?: string) => format(str, { parser: parser ?? 'html' });

const testEncodedHtml = `PGRpdiBkaXI9Imx0ciI-PGZvbnQgc2l6ZT0iNCI-SGVsbG8hPC9mb250PjxkaXY-PGk-VGhpczwvaT7CoGlzIGHCoDxiPnRlc3Q8L2I-wqA8dT5lbWFpbDwvdT4uPC9kaXY-PGRpdj48dWw-PGxpIHN0eWxlPSJtYXJnaW4tbGVmdDoxNXB4Ij5JdGVtIDE8L2xpPjxsaSBzdHlsZT0ibWFyZ2luLWxlZnQ6MTVweCI-SXRlbSAyPC9saT48bGkgc3R5bGU9Im1hcmdpbi1sZWZ0OjE1cHgiPkl0ZW0gMzwvbGk-PC91bD48ZGl2PkxldCYjMzk7cyBoYXZlIHNvbWUgJnF1b3Q7dGV4dCZxdW90OyB3aXRoIHNwZWNpYWwgY2hhcnMgJmFtcDsgc3R1ZmYgLSAxMDAlIPCfmIo8L2Rpdj48ZGl2Pjxicj48L2Rpdj48ZGl2PjxhIGhyZWY9Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vIiB0YXJnZXQ9Il9ibGFuayI-R29vZ2xlIExpbms8L2E-PC9kaXY-PC9kaXY-PGRpdj48YnI-PC9kaXY-PGRpdj48aW1nIHNyYz0iY2lkOmlpX2xqdDNlNWV4MSIgYWx0PSJidXJyaXRvLWRvZy5wbmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBjbGFzcz0iZ21haWwtQ1RvV1VkIj48L2Rpdj48L2Rpdj4NCg==`;
const testDecodedHtml = `<div dir="ltr"><font size="4">Hello!</font><div><i>This</i> is a <b>test</b> <u>email</u>.</div><div><ul><li style="margin-left:15px">Item 1</li><li style="margin-left:15px">Item 2</li><li style="margin-left:15px">Item 3</li></ul><div>Let&#39;s have some &quot;text&quot; with special chars &amp; stuff - 100% 😊</div><div><br></div><div><a href="https://www.google.com/" target="_blank">Google Link</a></div></div><div><br></div><div><img src="cid:ii_ljt3e5ex1" alt="burrito-dog.png" width="128" height="128" class="gmail-CToWUd"></div></div>`;

describe('Encode/Decode HTML', () => {
  test('correctly decodes text/html', () => {
    const decodedHtml = decode(testEncodedHtml);
    expect(formatStmt(decodedHtml)).toStrictEqual(formatStmt(testDecodedHtml));
  });

  test('correctly encodes and re-decodes text/html', () => {
    const encodedHtml = encode(testDecodedHtml);
    const reDecodedHtml = decode(encodedHtml);
    expect(formatStmt(reDecodedHtml)).toStrictEqual(formatStmt(testDecodedHtml));
  });
});

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

    expect(parsedEmail.id).toBe('id');
    expect(parsedEmail.threadId).toBe('threadId');
    expect(parsedEmail.labelIds).toStrictEqual(['Label_1', 'Label_2']);
    expect(parsedEmail.snippet).toBe('Test snippet of text');
    expect(parsedEmail.historyId).toBe('historyId');
    expect(parsedEmail.internalDate).toBe(1688902332920);
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
    const turndownSvc = new TurndownService();
    const markdown = turndownSvc.turndown(html);
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

describe('Fix Hrefs', () => {
  test('adds quotes to href tags in html', () => {
    const htmlWithBadHrefs = `<a href=https://www.google.com/abc-123_hello style="color: #166BDA;">Google</a>`;
    const fixedHrefs = fixHrefs(htmlWithBadHrefs);
    expect(fixedHrefs).toBe(`<a href="https://www.google.com/abc-123_hello" style="color: #166BDA;">Google</a>`);
  });

  test('adds quotes to href tags - url at the end', () => {
    const htmlWithBadHrefs = `<a style="color: #166BDA;" href=https://www.google.com/abc-123_hello>Google</a>`;
    const fixedHrefs = fixHrefs(htmlWithBadHrefs);
    expect(fixedHrefs).toBe(`<a style="color: #166BDA;" href="https://www.google.com/abc-123_hello">Google</a>`);
  });

  test('ignores correct href tags', () => {
    const htmlWithGoodHrefs = `<a href="https://www.google.com/abc-123_hello" style="color: #166BDA;">Google</a>`;
    const fixedHrefs = fixHrefs(htmlWithGoodHrefs);
    expect(fixedHrefs).toBe(`<a href="https://www.google.com/abc-123_hello" style="color: #166BDA;">Google</a>`);
  });
});

describe('Format Paragraph Blocks', () => {
  test('format null paragraph blocks', () => {
    const actualBlock = formatParagraphBlocks('');
    expect(actualBlock).toBe(null);
  });

  test('format single paragraph block', () => {
    const actualBlocks = formatParagraphBlocks('Hello here is a single line of text');

    const expectedBlocks = [
      {
        object: 'block',
        type: BlockType.paragraph,
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: 'Hello here is a single line of text',
              },
            },
          ],
        },
      },
    ];
    expect(actualBlocks).toStrictEqual(expectedBlocks);
  });

  test('format multiple paragraph blocks', () => {
    const actualBlocks = formatParagraphBlocks('\nHello here are a \n\r\nfew lines of text\n \n\n\r');

    const expectedBlocks = [
      {
        object: 'block',
        type: BlockType.paragraph,
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: 'Hello here are a ',
              },
            },
          ],
        },
      } as NotionParagraphBlock,
      {
        object: 'block',
        type: BlockType.paragraph,
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: 'few lines of text',
              },
            },
          ],
        },
      } as NotionParagraphBlock,
    ];

    expect(actualBlocks).toStrictEqual(expectedBlocks);
  });
});

describe('Format Prop Values', () => {
  test('formats title property', () => {
    const titlePropVal = createDbPropValue(NotionPropertyType.title);
    let expectedProp = {};
    expectedProp[titlePropVal.propName] = {
      title: [
        {
          text: {
            content: titlePropVal.propValue,
          },
        },
      ],
    };

    expect(formatPropValues([titlePropVal])).toStrictEqual(expectedProp);
  });

  test('formats select property', () => {
    const selectPropVal = createDbPropValue(NotionPropertyType.select);
    let expectedProp = {};
    expectedProp[selectPropVal.propName] = {
      select: {
        name: selectPropVal.propValue,
      },
    };

    expect(formatPropValues([selectPropVal])).toStrictEqual(expectedProp);
  });

  test('formats multi_select property', () => {
    const multiSelectPropVal = createDbPropValue(NotionPropertyType.multi_select, 'option1,option2,option3');
    let expectedProp = {};
    expectedProp[multiSelectPropVal.propName] = {
      multi_select: multiSelectPropVal.propValue.split(',').map(v => {
        return { name: v };
      }),
    };

    expect(formatPropValues([multiSelectPropVal])).toStrictEqual(expectedProp);
  });

  test('formats rich_text property', () => {
    const richTextPropVal = createDbPropValue(NotionPropertyType.rich_text);
    let expectedProp = {};
    expectedProp[richTextPropVal.propName] = {
      rich_text: [
        {
          text: {
            content: richTextPropVal.propValue,
          },
        },
      ],
    };

    expect(formatPropValues([richTextPropVal])).toStrictEqual(expectedProp);
  });

  test('formats url property', () => {
    const urlPropVal = createDbPropValue(NotionPropertyType.url);
    let expectedProp = {};
    expectedProp[urlPropVal.propName] = {
      url: urlPropVal.propValue,
    };

    expect(formatPropValues([urlPropVal])).toStrictEqual(expectedProp);
  });

  test('formats number property', () => {
    const numberPropVal = createDbPropValue(NotionPropertyType.number);
    let expectedProp = {};
    expectedProp[numberPropVal.propName] = {
      number: Number.parseInt(numberPropVal.propValue),
    };

    expect(formatPropValues([numberPropVal])).toStrictEqual(expectedProp);
  });

  test('formats status property', () => {
    const statusPropVal = createDbPropValue(NotionPropertyType.status);
    let expectedProp = {};
    expectedProp[statusPropVal.propName] = {
      status: {
        name: statusPropVal.propValue,
      },
    };

    expect(formatPropValues([statusPropVal])).toStrictEqual(expectedProp);
  });

  test('formats checkbox property', () => {
    const checkboxPropVal = createDbPropValue(NotionPropertyType.checkbox);
    let expectedProp = {};
    expectedProp[checkboxPropVal.propName] = {
      checkbox: checkboxPropVal.propValue === 'true' ? true : false,
    };

    expect(formatPropValues([checkboxPropVal])).toStrictEqual(expectedProp);
  });

  test('formats date property', () => {
    const datePropVal = createDbPropValue(NotionPropertyType.date, '2023-06-28');

    const newDate = new Date(datePropVal.propValue);
    const offset = newDate.getTimezoneOffset();
    const d = new Date(newDate.getTime() - offset * 60 * 1000);
    const val = d.toISOString().split('T')[0];

    let expectedProp = {};
    expectedProp[datePropVal.propName] = {
      date: {
        start: val,
        end: null,
        time_zone: null,
      },
    };

    expect(formatPropValues([datePropVal])).toStrictEqual(expectedProp);
  });
});

describe('Convert Email To Notion Page', () => {
  test('convert a typical email to a notion entry', () => {
    let html = '';
    html += createH1('Hello');
    html += createLineBreak();
    html += createParagraph('this is a test');
    html += createLink('Test Link', 'http://www.example.com');
    html += createLineBreak();
    html += createImg('content-id', 'test.jpg');

    const expectedContent = `
Hello
=====

this is a test
Test Link <http://www.example.com>[image: cid:content-id]`;

    const email = createEmail();
    email.textHtml = html;
    email.headers.to = `${faker.person.fullName()} <${faker.internet.email()}>`;
    email.headers.from = `${faker.person.fullName()} <${faker.internet.email()}>`;
    email.headers.date = new Date(1689134349395).toUTCString();
    email.headers.subject = 'Test subject';

    const { content, properties } = convertEmailToNotionPage(email);

    expect(content.trim()).toBe(expectedContent.trim());

    const expectedProps = {
      Name: {
        title: [
          {
            text: {
              content: email.headers.subject,
            },
          },
        ],
      },
      To: {
        rich_text: [
          {
            text: {
              content: email.headers.to,
            },
          },
        ],
      },
      From: {
        rich_text: [
          {
            text: {
              content: email.headers.from,
            },
          },
        ],
      },
      Date: {
        date: {
          start: '2023-07-11',
          end: null,
          time_zone: null,
        },
      },
    };

    expect(properties).toStrictEqual(expectedProps);
  });
});
