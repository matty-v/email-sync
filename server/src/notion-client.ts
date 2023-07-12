import axios from 'axios';
import { env } from './env';
import {
  BlockType,
  DbPropValue,
  NotionPageObject,
  NotionParagraphBlock,
  NotionProperties,
  NotionPropertyType,
} from './types';

const notionApiUrl = 'https://api.notion.com/v1/';
const notionVersion = '2022-06-28';

let notionClient;

export const initNotionClient = () => {
  notionClient = axios.create({
    baseURL: notionApiUrl,
    headers: {
      'Notion-Version': notionVersion,
      Authorization: `Bearer ${env.NOTION_API_TOKEN}`,
    },
  });
};

export const getEmailDatabaseId = (): string => {
  return env.NOTION_API_EMAILS_DB_ID;
};

export const createPageInDatabase = async (
  database_id: string,
  propValues: DbPropValue[],
  markdownContent: string,
): Promise<NotionPageObject> => {
  const parent = { database_id };
  const properties = formatPropValues(propValues);
  const paragraphBlocks = convertMarkdownToBlocks(markdownContent);
  const content = paragraphBlocks === null ? null : { children: paragraphBlocks };

  return await createNewPage(parent, properties, content);
};

export const createNewPage = async (
  parent: { database_id: string },
  properties: NotionProperties,
  content?: { children: NotionParagraphBlock[] } | null,
): Promise<NotionPageObject> => {
  const requestBody = {
    parent,
    properties,
    ...(content && content),
  };

  const response = await notionClient.post('pages', requestBody);

  return response.data;
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

export const convertMarkdownToBlocks = (markdownContent: string): NotionParagraphBlock[] | null => {
  if (!markdownContent) return null;

  const blocks: NotionParagraphBlock[] = [];

  markdownContent.split('\n').forEach(line => {
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
