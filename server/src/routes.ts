import { Router } from 'express';
import emailController from './email-sync-controller';

const routes = Router();

routes.use('/api/emails', emailController);

export default routes;
