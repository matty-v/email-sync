// Gmail API Types ======================

export type GmailLabel = {
  id?: string;
  name?: string;
  messageListVisibility?: string;
  labelListVisibility?: string;
  type?: string;
};

export type GmailMessageMetadata = {
  id?: string;
  threadId?: string;
};

export type GmailMessageHeader = {
  name?: string;
  value?: string;
};

export type GmailMessageBody = {
  size?: number;
  data?: string;
  attachmentId?: string;
};

export type GmailMessagePart = {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: GmailMessageHeader[];
  parts?: GmailMessagePart[];
  body?: GmailMessageBody;
};

export type GmailMessagePayload = {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: GmailMessageHeader[];
  body?: GmailMessageBody;
  parts?: GmailMessagePart[];
};

export type GmailMessage = GmailMessageMetadata & {
  labelIds?: string[];
  snippet?: string;
  payload?: GmailMessagePayload;
  sizeEstimate?: number;
  historyId?: string;
  internalDate?: string;
};

// Notion API Types ===============================

export enum NotionPropertyType {
  title = 'title',
  multi_select = 'multi_select',
  date = 'date',
  select = 'select',
  rich_text = 'rich_text',
  status = 'status',
  url = 'url',
  number = 'number',
  last_edited_time = 'last_edited_time',
  created_time = 'created_time',
  checkbox = 'checkbox',
  phone_number = 'phone_number',
  people = 'people',
  files = 'files',
}

export enum ItemType {
  page = 'page',
  database = 'database',
}

export enum ParentType {
  workspace = 'workspace',
  page_id = 'page_id',
  database_id = 'database_id',
}

export enum IconType {
  emoji = 'emoji',
  external = 'external',
}

type NotionObject = {
  id: string;
  created_time: string;
  last_edited_time: string;
  parent?: NotionDatabaseParent | NotionPageParent | NotionWorkspaceParent;
  properties: NotionProperties;
  url: string;
  icon: IconProp | null;
};

export type NotionPageOrDatabaseObject = NotionObject & (NotionPageObject | NotionDatabaseObject);

export type NotionPageObject = NotionObject & {
  object: ItemType.page;
};

export type NotionDatabaseObject = NotionObject & {
  object: ItemType.database;
  title: NotionTitle[];
};

export type NotionDatabaseParent = {
  type: ParentType.database_id;
  database_id: string;
};

export type NotionPageParent = {
  type: ParentType.page_id;
  page_id: string;
};

export type NotionWorkspaceParent = {
  type: ParentType.workspace;
  workspace: boolean;
};

export type NotionTitle = {
  type: string;
  text?: {};
  annotations?: {};
  href?: any;
  plain_text: string;
};

export type NotionProperties = {
  [key: string]: NotionProp;
};

export type NotionProp = {
  id: string;
  type: NotionPropertyType;
  name?: string;
  rich_text?: NotionRichTextSegment[];
};

export type NotionStatusProp = NotionProp & {
  status: {
    options: NotionSelectOption[];
  };
};

export type NotionSelectProp = NotionProp & {
  select: {
    options: NotionSelectOption[];
  };
};

export type NotionMultiSelectProp = NotionProp & {
  multi_select: {
    options: NotionSelectOption[];
  };
};

export type NotionTitleProp = NotionProp & {
  title: NotionTitle[] | {};
};

export type NotionSelectOption = {
  id: string;
  name: string;
  color: string;
};

export type NotificationPayload = {
  Message: string;
  LinkName?: string;
  LinkUrl?: string;
};

export type IconProp = {
  type: IconType;
  emoji?: string;
  external?: {
    url: string;
  };
};

export type NotionBlock = {
  object: 'block';
  type: BlockType;
};

export type NotionParagraphBlock = NotionBlock & {
  paragraph: {
    rich_text: NotionRichTextSegment[];
  };
};

export type NotionRichTextSegment = {
  type: 'text';
  text: {
    content: string;
    link?: {
      url: string;
    };
  };
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
  };
  plain_text?: string;
  href?: string;
};

export enum BlockType {
  paragraph = 'paragraph',
}

export type DbPropValue = {
  propName: string;
  propValue: string;
  propType: NotionPropertyType;
};

// My API Types ===================================
export type AttachmentLink = {
  filename: string;
  url: string;
  cid: string;
};

export type GoogleDriveFile = {
  dataBuffer: Buffer;
  filename: string;
  mimeType: string;
};

export type EmailAttachmentData = {
  size: number;
  payload: string;
};

export type EmailAttachment = {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
  cid?: string;
  headers: {
    [key: string]: string;
  };
};

export type Email = {
  id: string;
  linkToPdf?: string;
  gmailMeta: {
    threadId: string;
    historyId: string;
    internalDate: number;
  };
  labelIds: string[];
  snippet: string;
  hash: string;
  attachments: EmailAttachment[];
  headers: {
    [key: string]: string;
  };
  textPlain?: string;
  textHtml: string;
  textMarkdown: string;
};
