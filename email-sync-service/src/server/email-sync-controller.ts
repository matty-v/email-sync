import { Request, RequestHandler, Response, Router } from 'express';
import { fetchAttachment, fetchEmailsByLabelName, syncEmail } from '../email-sync-svc';
import authFilter from './auth-filter';

/**
 * /api/emails
 */
const emailController = Router();
emailController.use(authFilter);

// Fetch all emails with a label
emailController.get('/label/:labelName', (async (req: Request, res: Response) => {
  return res.json(await fetchEmailsByLabelName(req.params.labelName));
}) as RequestHandler);

// Fetch an attachment by message ID and attachment ID
emailController.get('/:messageId/attachment/:attachmentId', (async (req: Request, res: Response) => {
  return res.json(await fetchAttachment(req.params.messageId, req.params.attachmentId));
}) as RequestHandler);

// Sync an email to Notion given the message ID
emailController.post('/:messageId/sync', (async (req: Request, res: Response) => {
  return res.json(await syncEmail(req.params.messageId));
}) as RequestHandler);

export default emailController;
