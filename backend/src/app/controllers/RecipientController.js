import * as Yup from 'yup';
import Recipient from '../models/Recipient';

class RecipientsController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      street: Yup.string().required(),
      number: Yup.number().required(),
      complement: Yup.string().notRequired(),
      uf: Yup.string().required().length(2),
      city: Yup.string().required(),
      zip_code: Yup.string().required().length(8),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ Erro: 'Falha na validação!' });
    }
    const { name, street, number, complement, uf, city, zip_code } = req.body;

    const { id } = await Recipient.create({
      name,
      street,
      number,
      complement,
      uf,
      city,
      zip_code,
    });

    return res.json({
      id,
      name,
      street,
      number,
      complement,
      uf,
      city,
      zip_code,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      street: Yup.string(),
      number: Yup.number(),
      complement: Yup.string(),
      uf: Yup.string().length(2),
      city: Yup.string(),
      zip_code: Yup.string().length(8),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ Erro: 'Falha na validação!' });
    }
    const recipient = await Recipient.findByPk(req.body.id);

    if (!recipient) {
      return res.status(400).json({ Error: 'Destinatário não existe!' });
    }

    const { name, street, number, complement, uf, city, zip_code } = req.body;

    await recipient.update({
      name,
      street,
      number,
      complement,
      uf,
      city,
      zip_code,
    });

    return res.json({
      name,
      street,
      number,
      complement,
      uf,
      city,
      zip_code,
    });
  }
}

export default new RecipientsController();
