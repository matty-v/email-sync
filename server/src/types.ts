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

export type GmailMessagePart = {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: GmailMessageHeader[];
  body?: {
    size?: number;
    data?: string;
  };
};

export type GmailMessagePayload = {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: GmailMessageHeader[];
  body?: {
    size?: number;
  };
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

export type EmailAttachmentData = {
  size: number;
  payload: string;
};

export type EmailAttachment = {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
  headers: {
    [key: string]: string;
  };
};

export type Email = {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: number;
  attachments: EmailAttachment[];
  inline: EmailAttachment[];
  headers: {
    subject: string;
    from: string;
    to: string;
    date: string;
  };
  textPlain: string;
  textHtml: string;
};
