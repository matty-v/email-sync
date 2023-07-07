import axios, { AxiosInstance } from 'axios';
import { GOOGLE_JWT_KEY } from '../consts';
import { Email, EmailAttachmentData } from '../types';

const apiServerUrl = process.env.REACT_APP_API_SERVER_URL;

export const fetchEmailsWithLabel = async (labelName: string): Promise<Email[]> => {
  const response = await createApiClient().get(`/api/emails/label/${encodeURIComponent(labelName)}`);
  return response.data;
};

export const fetchAttachmentById = async (messageId: string, attachmentId: string): Promise<EmailAttachmentData> => {
  const response = await createApiClient().get(
    `/api/emails/message/${messageId}/attachment/${encodeURIComponent(attachmentId)}`,
  );
  return response.data;
};

const createApiClient = (): AxiosInstance => {
  return axios.create({
    baseURL: apiServerUrl,
    headers: {
      ...createAuthHeader(),
    },
  });
};

const createAuthHeader = () => {
  const token = localStorage.getItem(GOOGLE_JWT_KEY);
  if (!token) {
    throw new Error('Failed to make an authenticated request! User is not logged in.');
  }
  return { 'x-id-token': `${localStorage.getItem(GOOGLE_JWT_KEY)}` };
};
