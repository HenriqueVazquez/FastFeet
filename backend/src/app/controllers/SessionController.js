import * as Yup from 'yup';
import jwt from 'jsonwebtoken';

import User from '../models/User';
import authConfig from '../../config/auth';

class SessionController {
  async store(req, res) {
    const schema = Yup.object().shape({
      email: Yup.string().email().required(),
      password: Yup.string().required(),
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ Erro: 'Falha na validação!' });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ Erro: 'Usuário não localizado!' });
    }

    if (!(await user.checkPassword(password))) {
      return res.status(401).json({ erro: 'Senha não esta correta' });
    }

    const { id, name } = user;
    const token = jwt.sign({ id }, authConfig.secret, {
      expiresIn: authConfig.expiresIn,
    });

    req.userToken = token;

    return res.json({
      user: {
        id,
        name,
      },
      token: jwt.sign({ id }, authConfig.secret, {
        expiresIn: authConfig.expiresIn,
      }),
    });
  }
}

export default new SessionController();
