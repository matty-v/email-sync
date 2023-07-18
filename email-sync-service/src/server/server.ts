import cors from 'cors';
import express, { Request, RequestHandler, Response } from 'express';
import morgan from 'morgan';
import { initGmailClient } from '../clients/gmail-client';
import { initGoogleDriveClient } from '../clients/google-drive-client';
import { initNotionClient } from '../clients/notion-client';
import { env, loadEnv } from '../env';
import routes from './routes';

loadEnv();

initGoogleDriveClient();
initGmailClient();
initNotionClient();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('tiny'));

app.get('/', (async (_: Request, res: Response) => {
  res.json({ health: 'OK' });
}) as RequestHandler);

app.use(routes);

app.listen(env.PORT, () => {
  console.log(`email sync server is listening on port ${env.PORT}...`);
});
