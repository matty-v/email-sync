import { drive_v3, google } from 'googleapis';
import { Readable } from 'node:stream';
import { env } from './env';
import { GoogleDriveFile } from './types';

let driveClient: drive_v3.Drive;

export const initGoogleDriveClient = () => {
  driveClient = google.drive({
    version: 'v3',
    auth: google.auth.fromJSON({
      type: 'authorized_user',
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.DRIVE_API_REFRESH_TOKEN,
    }) as any,
  });
};

export const getAttachmentsFolderId = () => {
  return env.DRIVE_EMAIL_ATTACHMENTS_FOLDER_ID;
};

export const getMessagesFolderId = () => {
  return env.DRIVE_EMAIL_MESSAGES_FOLDER_ID;
};

export const uploadFileToFolder = async (driveFile: GoogleDriveFile, folderId: string): Promise<string> => {
  let uploadedFileId: string = null;

  const requestBody = {
    name: driveFile.filename,
    fields: 'id',
    parents: [folderId],
  };
  const media = {
    mimeType: driveFile.mimeType,
    body: Readable.from(driveFile.dataBuffer),
  };

  try {
    const file = await driveClient.files.create({
      requestBody,
      media: media,
    });
    uploadedFileId = file.data.id;
  } catch (e) {
    console.log(`Failed to upload file into folder with ID [${folderId}]: ${JSON.stringify(driveFile, null, 2)}`);
    console.error(e);
  }

  return uploadedFileId;
};

export const fetchFilesInFolder = async (folderId: string): Promise<any[]> => {
  let files: any[];
  try {
    const res = await driveClient.files.list({ q: `'${folderId}' in parents` });
    files = res.data.files;
  } catch (e) {
    console.log(`Failed to fetch files with folder id [${folderId}]!`);
    console.error(e);
  }
  return files;
};

export const fetchFileLinkById = async (fileId: string): Promise<string> => {
  let fileLink: string = null;
  try {
    const res = await driveClient.files.get({ fileId, fields: 'webViewLink' });
    fileLink = res.data.webViewLink;
  } catch (e) {
    console.log(`Failed to fetch file by id [${fileId}]!`);
    console.error(e);
  }

  return fileLink;
};
