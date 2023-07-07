import { Request, RequestHandler, Response, Router } from 'express';
import authFilter from './auth-filter';
import { GmailClient } from './gmail-client';

/**
 * /api/emails
 */
const emailController = Router();
emailController.use(authFilter);

// Fetch all emails with a label
emailController.get('/label/:labelName', (async (req: Request, res: Response) => {
  const emails = await GmailClient.Instance.fetchEmailsWithLabel(req.params.labelName);
  return res.json(emails);
}) as RequestHandler);

// Fetch all emails with a label
emailController.get('/message/:messageId/attachment/:attachmentId', (async (req: Request, res: Response) => {
  const attachment = await GmailClient.Instance.fetchAttachmentById(req.params.messageId, req.params.attachmentId);
  return res.json(attachment);
}) as RequestHandler);

export default emailController;
