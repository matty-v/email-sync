import { describe, expect, test } from '@jest/globals';
import { convertMarkdownToBlocks, formatLinkSegment, formatPropValues } from '../notion-client';
import { BlockType, NotionParagraphBlock, NotionPropertyType } from '../types';
import { createDbPropValue } from './test-utils';

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

describe('Converts markdown to blocks', () => {
  test('convert markdown', () => {
    const markdown = `Some *text* and [sail however happily](https://impractical-fat.com) more [alongside apud hm](https://jumpy-wall.name)`;

    const expectedBlocks: NotionParagraphBlock[] = [
      {
        object: 'block',
        type: BlockType.paragraph,
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: 'Some *text* and ',
              },
            },
            {
              type: 'text',
              text: {
                content: 'sail however happily',
                link: {
                  url: 'https://impractical-fat.com',
                },
              },
              plain_text: 'sail however happily',
              href: 'https://impractical-fat.com',
            },
            {
              type: 'text',
              text: {
                content: ' more ',
              },
            },
            {
              type: 'text',
              text: {
                content: 'alongside apud hm',
                link: {
                  url: 'https://jumpy-wall.name',
                },
              },
              plain_text: 'alongside apud hm',
              href: 'https://jumpy-wall.name',
            },
          ],
        },
      },
    ];

    const blocks = convertMarkdownToBlocks(markdown);

    expect(blocks).toStrictEqual(expectedBlocks);
  });

  test('handles no content', () => {
    const actualBlock = convertMarkdownToBlocks('');
    expect(actualBlock).toBe(null);
  });
  test('handles simple text content', () => {
    const actualBlocks = convertMarkdownToBlocks('Hello here is a single line of text');

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
  test('handles line breaks', () => {
    const actualBlocks = convertMarkdownToBlocks('\nHello here are a \n\r\nfew lines of text\n \n\n\r');

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
  test('handles bold', () => {});
  test('handles underline', () => {});
  test('handles italics', () => {});
  test('handles headers', () => {});
  test('handles paragraphs', () => {});
  test('format link segments', () => {
    const linkText = '[Link Text](https://this.is.a.link)';
    const expectedLinkSegment = {
      type: 'text',
      text: {
        content: 'Link Text',
        link: {
          url: 'https://this.is.a.link',
        },
      },
      plain_text: 'Link Text',
      href: 'https://this.is.a.link',
    };

    const linkSegment = formatLinkSegment(linkText);

    expect(linkSegment).toStrictEqual(expectedLinkSegment);
  });
  test('handles images', () => {});
});
