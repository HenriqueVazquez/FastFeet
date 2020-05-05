import jwt from 'jsonwebtoken';
import { promisify } from 'util';

import authConfig from '../../config/auth';

export default async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ Erro: 'Token não enviado, faça o login!' });
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = await promisify(jwt.verify)(token, authConfig.secret);

    req.userId = decoded.id;
    req.userToken = token;

    return next();
  } catch (err) {
    return res.status(401).json({ Erro: 'Token é invalido!' });
  }
};
