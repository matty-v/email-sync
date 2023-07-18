import axios, { AxiosInstance } from 'axios';
import { env } from '../env';
import { DbPropValue, NotionPageObject, NotionParagraphBlock, NotionProperties } from '../types';
import { convertMarkdownToBlocks, formatPropValues } from '../utils/notion-utils';

const notionApiUrl = 'https://api.notion.com/v1/';
const notionVersion = '2022-06-28';

let notionClient: AxiosInstance;

export const initNotionClient = () => {
  notionClient = axios.create({
    baseURL: notionApiUrl,
    headers: {
      'Notion-Version': notionVersion,
      Authorization: `Bearer ${env.NOTION_API_TOKEN}`,
    },
  });
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

  let createdPage: NotionPageObject;
  try {
    const response = await notionClient.post('pages', requestBody);
    createdPage = response.data;
  } catch (e) {
    console.log('Failed to create a new page with request body:');
    console.log(JSON.stringify(requestBody, null, 2));
    console.error(e);
  }

  return createdPage;
};

export const fetchPagesInDatabase = async (
  databaseId: string,
  existingPages: NotionPageObject[] = [],
  start_cursor: string = '',
): Promise<NotionPageObject[]> => {
  let pages: NotionPageObject[] = existingPages;

  try {
    const response = await notionClient.post(`databases/${databaseId}/query`, {
      ...(start_cursor && { start_cursor }),
    });
    pages.push(...response.data.results);

    if (response.data['has_more']) {
      console.log('fetching more results...');
      await fetchPagesInDatabase(databaseId, existingPages, response.data['next_cursor']);
    }
  } catch (e) {
    console.log(`Failed to fetch pages for database with ID [${databaseId}]`);
    console.error(e);
  }

  return pages;
};
