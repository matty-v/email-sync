import axios from 'axios';
import { env } from './env';
import { NotionPageObject, NotionProperties } from './types';
import { formatParagraphBlocks } from './utils';

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
  properties: NotionProperties,
  pageContent: string,
): Promise<NotionPageObject> => {
  return await createNewPage({ database_id }, properties, pageContent);
};

export const createNewPage = async (
  parent: any,
  properties: NotionProperties,
  pageContent: string,
): Promise<NotionPageObject> => {
  const paragraphBlocks = formatParagraphBlocks(pageContent);

  const requestBody = {
    parent,
    properties,
    ...(paragraphBlocks && { children: paragraphBlocks }),
  };

  const response = await notionClient.post('pages', requestBody);

  return response.data;
};
