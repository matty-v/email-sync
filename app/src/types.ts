export type NotificationPayload = {
  Message: string;
  Severity: 'error' | 'info' | 'success' | 'warning';
};

export type LoaderPayload = {
  Enabled: boolean;
  Progress?: number;
};

// API Interface - Todo make this easier to share with the server
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
