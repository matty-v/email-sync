import { describe, expect, test } from '@jest/globals';
import { formatParagraphBlocks } from '../notion-client';
import { BlockType, NotionParagraphBlock } from '../types';

describe('formatParagraphBlocks', () => {
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
