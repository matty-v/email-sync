export type NotificationPayload = {
  Message: string;
  Severity: 'error' | 'info' | 'success' | 'warning';
};

export type LoaderPayload = {
  Enabled: boolean;
  Progress?: number;
};
