import { Router, Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';

const authFilter = Router();

const notAuthorizedResponse = {
  message : 'Not authorized!'
}

authFilter.use(async (req: Request, res: Response, next: NextFunction) => {

  const idToken = req.headers['x-id-token'];

  if (!idToken) {
    return res.status(400).json(notAuthorizedResponse);
  }

  const idTokenUrl = `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${idToken}`;

  const response = await fetch(idTokenUrl, {
    method: 'POST'
  });

  const data = await response.json();

  if (!data || !data?.email || data?.email !== 'matt.voget@gmail.com') {
    return res.status(400).json(notAuthorizedResponse);
  }

  req['email'] = data.email;

  next();
});

export default authFilter;
