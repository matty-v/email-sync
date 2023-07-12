import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fetchAttachment, fetchEmailsByLabelName, syncEmail } from '../email-sync-svc';
import { fetchAttachmentById, fetchEmailById, fetchEmailsWithLabelId, fetchLabels } from '../gmail-client';
import { createPageInDatabase, getEmailDatabaseId } from '../notion-client';
import {
  GmailLabel,
  GmailMessage,
  GmailMessageBody,
  GmailMessageMetadata,
  ItemType,
  NotionPropertyType,
} from '../types';
import { convertEmailToNotionPage, parseGmailMessage } from '../utils';
import { createEmail, createGmailAttachment, createGmailMessage } from './test-utils';

jest.mock('../notion-client');
jest.mock('../gmail-client');
jest.mock('../utils');

let mockCreatePageInDatabase = createPageInDatabase as jest.Mock<typeof createPageInDatabase>;
let mockGetEmailDatabaseId = getEmailDatabaseId as jest.Mock<typeof getEmailDatabaseId>;

let mockFetchLabels = fetchLabels as jest.Mock<typeof fetchLabels>;
let mockFetchEmailsWithLabelId = fetchEmailsWithLabelId as jest.Mock<typeof fetchEmailsWithLabelId>;
let mockFetchEmailById = fetchEmailById as jest.Mock<typeof fetchEmailById>;
let mockFetchAttachmentById = fetchAttachmentById as jest.Mock<typeof fetchAttachmentById>;

let mockParseGmailMessage = parseGmailMessage as jest.Mock<typeof parseGmailMessage>;
let mockConvertEmailToNotionPage = convertEmailToNotionPage as jest.Mock<typeof convertEmailToNotionPage>;

const mockEmails = [createEmail(), createEmail(), createEmail()];
const mockedGmailMessageMetadata: GmailMessageMetadata[] = mockEmails.map(e => ({ id: e.id, threadId: e.threadId }));
const mockGmailMessages: GmailMessage[] = [
  createGmailMessage({
    content: mockEmails[0].textHtml,
    attachmentFilenames: mockEmails[0].attachments.map(a => a.filename),
  }),
  createGmailMessage({
    content: mockEmails[1].textHtml,
    attachmentFilenames: mockEmails[1].attachments.map(a => a.filename),
  }),
  createGmailMessage({
    content: mockEmails[2].textHtml,
    attachmentFilenames: mockEmails[2].attachments.map(a => a.filename),
  }),
];
const mockedGmailLabels: GmailLabel[] = [
  {
    id: 'TEST_LABEL_ID',
    name: 'TEST_LABEL',
  },
  {
    id: 'OTHER_LABEL_1_ID',
    name: 'OTHER_LABEL_1',
  },
  {
    id: 'OTHER_LABEL_2_ID',
    name: 'OTHER_LABEL_2',
  },
];
const mockAttachmentData: string = 'SGVsbG8gV29ybGQh';
const mockAttachment: GmailMessageBody = createGmailAttachment(mockAttachmentData);

const mockNotionContent = 'Hello world!';
const mockNotionProperties = {
  'test-prop': {
    id: 'test-prop-id',
    type: NotionPropertyType.title,
  },
};
const mockEmailsDbId = 'test-email-db-id';

beforeEach(() => {
  mockFetchLabels.mockResolvedValue(mockedGmailLabels);
  mockFetchEmailsWithLabelId.mockResolvedValue(mockedGmailMessageMetadata);
  mockFetchEmailById.mockResolvedValueOnce(mockGmailMessages[0]);
  mockFetchEmailById.mockResolvedValueOnce(mockGmailMessages[1]);
  mockFetchEmailById.mockResolvedValueOnce(mockGmailMessages[2]);
  mockParseGmailMessage.mockReturnValueOnce(mockEmails[0]);
  mockParseGmailMessage.mockReturnValueOnce(mockEmails[1]);
  mockParseGmailMessage.mockReturnValueOnce(mockEmails[2]);
  mockFetchAttachmentById.mockResolvedValue(mockAttachment);
  mockConvertEmailToNotionPage.mockReturnValue({
    content: mockNotionContent,
    properties: mockNotionProperties,
  });
  mockCreatePageInDatabase.mockResolvedValue({
    id: 'notion-page-id',
    object: ItemType.page,
    created_time: new Date().toUTCString(),
    last_edited_time: new Date().toUTCString(),
    url: 'https://my-test-notion.page',
    icon: null,
    properties: mockNotionProperties,
  });
  mockGetEmailDatabaseId.mockReturnValue(mockEmailsDbId);
});

afterEach(() => {
  mockFetchLabels.mockReset();
  jest.clearAllMocks();
});

describe('Get emails by label', () => {
  test('will fetch emails with a label', async () => {
    const emails = await fetchEmailsByLabelName(mockedGmailLabels[0].name);

    expect(mockFetchLabels).toBeCalledTimes(1);

    expect(mockFetchEmailsWithLabelId).toBeCalledTimes(1);
    expect(mockFetchEmailsWithLabelId).toBeCalledWith(mockedGmailLabels[0].id);

    expect(mockFetchEmailById).toBeCalledTimes(3);
    expect(mockFetchEmailById.mock.calls).toEqual([
      [mockedGmailMessageMetadata[0].id],
      [mockedGmailMessageMetadata[1].id],
      [mockedGmailMessageMetadata[2].id],
    ]);

    expect(mockParseGmailMessage).toBeCalledTimes(3);
    expect(mockParseGmailMessage.mock.calls).toEqual([
      [mockGmailMessages[0]],
      [mockGmailMessages[1]],
      [mockGmailMessages[2]],
    ]);

    expect(emails.length).toBe(3);
  });

  test('handles the case with no label', async () => {
    mockFetchLabels.mockResolvedValue([{ id: 'BLAH', name: 'BLAH' }]);

    const emails = await fetchEmailsByLabelName('NO_SUCH_LABEL');
    expect(emails.length).toBe(0);

    expect(mockFetchLabels).toBeCalledTimes(1);

    expect(mockFetchEmailsWithLabelId).toBeCalledTimes(0);
    expect(mockFetchEmailById).toBeCalledTimes(0);
    expect(mockParseGmailMessage).toBeCalledTimes(0);
  });

  test('handles the case with no messages for a label', async () => {
    mockFetchEmailsWithLabelId.mockResolvedValue([]);

    const emails = await fetchEmailsByLabelName(mockedGmailLabels[0].name);
    expect(emails.length).toBe(0);

    expect(mockFetchLabels).toBeCalledTimes(1);

    expect(mockFetchEmailsWithLabelId).toBeCalledTimes(1);
    expect(mockFetchEmailsWithLabelId).toBeCalledWith(mockedGmailLabels[0].id);

    expect(mockFetchEmailById).toBeCalledTimes(0);
    expect(mockParseGmailMessage).toBeCalledTimes(0);
  });

  test('handles no message data when fetching the first few messages by message ID', async () => {
    mockFetchEmailById.mockReset();
    mockFetchEmailById.mockResolvedValueOnce(null);
    mockFetchEmailById.mockResolvedValueOnce(null);
    mockFetchEmailById.mockResolvedValueOnce(mockGmailMessages[2]);

    const emails = await fetchEmailsByLabelName(mockedGmailLabels[0].name);
    expect(emails.length).toBe(1);

    expect(mockFetchLabels).toBeCalledTimes(1);

    expect(mockFetchEmailsWithLabelId).toBeCalledTimes(1);
    expect(mockFetchEmailsWithLabelId).toBeCalledWith(mockedGmailLabels[0].id);

    expect(mockFetchEmailById).toBeCalledTimes(3);
    expect(mockFetchEmailById.mock.calls).toEqual([
      [mockedGmailMessageMetadata[0].id],
      [mockedGmailMessageMetadata[1].id],
      [mockedGmailMessageMetadata[2].id],
    ]);

    expect(mockParseGmailMessage).toBeCalledTimes(1);
    expect(mockParseGmailMessage).toBeCalledWith(mockGmailMessages[2]);
  });
});

describe('Fetch attachment', () => {
  test('will fetch an attachment by message and attachment ID', async () => {
    const attachment = await fetchAttachment('test-message-id', 'test-attachment-id');

    expect(mockFetchAttachmentById).toBeCalledTimes(1);
    expect(mockFetchAttachmentById).toBeCalledWith('test-message-id', 'test-attachment-id');

    expect(attachment).toStrictEqual({
      payload: mockAttachment.data,
      size: mockAttachment.size,
    });
  });

  test('handles no attachment data returned from fetch', async () => {
    mockFetchAttachmentById.mockResolvedValue(null);

    const attachment = await fetchAttachment('test-message-id', 'test-attachment-id');
    expect(attachment).toBeNull();

    expect(mockFetchAttachmentById).toBeCalledTimes(1);
    expect(mockFetchAttachmentById).toBeCalledWith('test-message-id', 'test-attachment-id');
  });

  test('handles no message ID', async () => {
    const attachment = await fetchAttachment('', 'test-attachment-id');
    expect(attachment).toBeNull();
    expect(mockFetchAttachmentById).toBeCalledTimes(0);
  });

  test('handles no attachment ID', async () => {
    const attachment = await fetchAttachment('test-message-id', '');
    expect(attachment).toBeNull();
    expect(mockFetchAttachmentById).toBeCalledTimes(0);
  });
});

describe('Sync Email', () => {
  test('will sync an email to Notion', async () => {
    mockParseGmailMessage.mockReset();
    mockParseGmailMessage.mockReturnValue(mockEmails[0]);

    await syncEmail(mockGmailMessages[0].id);

    expect(mockFetchEmailById).toBeCalledTimes(1);
    expect(mockFetchEmailById).toBeCalledWith(mockGmailMessages[0].id);

    expect(mockParseGmailMessage).toBeCalledTimes(1);
    expect(mockParseGmailMessage).toBeCalledWith(mockGmailMessages[0]);

    expect(mockConvertEmailToNotionPage).toBeCalledTimes(1);
    expect(mockConvertEmailToNotionPage).toBeCalledWith(mockEmails[0]);

    expect(mockGetEmailDatabaseId).toBeCalledTimes(1);

    expect(mockCreatePageInDatabase).toBeCalledTimes(1);
    expect(mockCreatePageInDatabase).toBeCalledWith(mockEmailsDbId, mockNotionProperties, mockNotionContent);
  });

  test('handles no message found with the given ID', async () => {
    mockFetchEmailById.mockReset();
    mockFetchEmailById.mockResolvedValue(null);

    await syncEmail(mockGmailMessages[0].id);

    expect(mockFetchEmailById).toBeCalledTimes(1);
    expect(mockFetchEmailById).toBeCalledWith(mockGmailMessages[0].id);

    expect(mockParseGmailMessage).toBeCalledTimes(0);
    expect(mockConvertEmailToNotionPage).toBeCalledTimes(0);
    expect(mockGetEmailDatabaseId).toBeCalledTimes(0);
    expect(mockCreatePageInDatabase).toBeCalledTimes(0);
  });
});
