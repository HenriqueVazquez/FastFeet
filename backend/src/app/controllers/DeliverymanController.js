import * as Yup from 'yup';
import { Op } from 'sequelize';
import Deliveryman from '../models/Deliveryman';
import File_avatar from '../models/File_avatar';

class DeliverymanController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      avatar_id: Yup.string(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ Erro: 'Falha na validação!' });
    }

    const deliverymanExist = await Deliveryman.findOne({
      where: { email: req.body.email },
    });

    if (deliverymanExist) {
      return res.status(400).json({ Erro: 'Usuário já existe!' });
    }

    const { name, email, avatar_id } = req.body;

    const { id } = await Deliveryman.create({ name, email, avatar_id });

    return res.json({ id, name, email, avatar_id });
  }

  async index(req, res) {
    const { page = 1, filterName } = req.query;
    const deliverymen = filterName
      ? await Deliveryman.findAll({
          where: {
            name: {
              [Op.iLike]: `${filterName}%`,
            },
          },

          attributes: ['id', 'name', 'email', 'status'],
          order: ['id'],
          limit: 5,
          offset: (page - 1) * 5,
          include: [
            {
              model: File_avatar,
              as: 'avatar',
              attributes: ['id', 'name', 'path', 'url'],
            },
          ],
        })
      : await Deliveryman.findAll({
          attributes: ['id', 'name', 'email', 'status'],
          order: ['id'],
          limit: 5,
          offset: (page - 1) * 5,
          include: [
            {
              model: File_avatar,
              as: 'avatar',
              attributes: ['id', 'name', 'path', 'url'],
            },
          ],
        });

    return res.json(deliverymen);
  }

  async show(req, res) {
    const { id } = req.params;

    const deliveryman = await Deliveryman.findByPk(id, {
      paranoid: false,
      attributes: ['id', 'name', 'email', 'avatar_id', 'status', 'deleted_at'],
      include: [
        {
          model: File_avatar,
          as: 'avatar',
          attributes: ['name', 'path', 'url'],
        },
      ],
    });

    if (!deliveryman) {
      return res.status(400).json({
        Erro: 'Entregador não existe na base de dados, verifique o ID',
      });
    }
    const checkDeleted = await deliveryman.deleted_at;
    if (checkDeleted !== null) {
      deliveryman.status = 'Desativado';
    }
    if (checkDeleted === null) {
      deliveryman.status = 'Ativo';
    }

    return res.json(deliveryman);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number(),
      name: Yup.string(),
      email: Yup.string().email(),
      avatar_id: Yup.number().nullable(),
      situationStatus: Yup.number().min(1).max(2),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ Erro: 'Falha na validação!' });
    }

    const { id, name, email, avatar_id, situationStatus } = req.body;

    // verificar se ID foi informado
    if (!id) {
      return res
        .status(400)
        .json({ Erro: 'Informe o ID para atualizar entregador!' });
    }

    // Verificar se entregador existe

    const deliveryman = await Deliveryman.findByPk(id, {
      paranoid: false,
      attributes: ['id', 'name', 'email', 'avatar_id', 'deleted_at', 'status'],
      include: [
        {
          model: File_avatar,
          as: 'avatar',
          attributes: ['path', 'url'],
        },
      ],
    });

    if (!deliveryman) {
      return res.status(400).json({
        Erro: 'Entregador não existe na base de dados, verifique o ID',
      });
    }

    // Verificar se ID do avatar é valido

    const avatarExist = await File_avatar.findByPk(avatar_id);
    if (avatar_id !== null) {
      if (!avatarExist) {
        return res.status(400).json({ Erro: 'O ID do avatar é invalido' });
      }
    }

    // verificar se o e-mail esta vinculado com outro usuário

    if (email && email !== deliveryman.email) {
      const emailExist = await Deliveryman.findOne({ where: { email } });

      if (emailExist) {
        return res
          .status(400)
          .json({ Erro: 'E-mail já esta vinculado a outro usuário!' });
      }
    }

    // verificar a situação do status

    const status =
      situationStatus === 1
        ? (deliveryman.status = 'Ativo')
        : (deliveryman.status = 'Desativado');
    const deleted_at =
      status === 'Ativo'
        ? (deliveryman.deleted_at = null)
        : (deliveryman.deleted_at = new Date());

    await deliveryman.update({ name, email, avatar_id, deleted_at, status });

    return res.json(deliveryman);
  }

  async delete(req, res) {
    const { id } = req.params;

    const deliveryman = await Deliveryman.findByPk(id);

    // verificar se usuario existe
    if (!deliveryman) {
      return res.status(400).json({
        ERRO: 'Entregador não localizado, verifique o ID e tente novamente!',
      });
    }

    deliveryman.status = 'Desativado';

    await deliveryman.destroy();

    return res.json(
      `Entregador de ID ${id} ${deliveryman.name} foi ${deliveryman.status}`
    );
  }
}

export default new DeliverymanController();
