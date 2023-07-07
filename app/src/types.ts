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
