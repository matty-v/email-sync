import cors from 'cors';
import express, { Request, RequestHandler, Response } from 'express';
import morgan from 'morgan';
import routes from './routes';
require('dotenv').config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('tiny'));

app.get('/', (async (_: Request, res: Response) => {
  res.json({ health: 'OK' });
}) as RequestHandler);

app.use(routes);

app.listen(PORT, () => {
  console.log(`email sync server is listening on port ${PORT}...`);
});
