import * as Yup from 'yup';
import { parseISO, isAfter, isBefore, setHours, startOfHour } from 'date-fns';

import { Op } from 'sequelize';

import Delivery from '../models/Delivery';
import Deliveryman from '../models/Deliveryman';
import Recipient from '../models/Recipient';
import File_signature from '../models/File_signature';
import File_avatar from '../models/File_avatar';
import CancellationDeliveryMail from '../../app/jobs/CancellationDeliveryMail';
import CreationDeliveryMail from '../../app/jobs/CreationDeliveryMail';
import Queue from '../../lib/Queue';


class DeliveryController {
  async store(req, res) {
    const schema = Yup.object().shape({
      product: Yup.string().required(),
      recipient_id: Yup.number().required(),
      deliveryman_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ Erro: 'Erro na validação!' });
    };

    const { product, recipient_id, deliveryman_id } = req.body;

    // Checar se entregador existe
    const deliveryman = await Deliveryman.findByPk(deliveryman_id);

    if (!deliveryman) {
      return res.status(400).json({
        Erro: 'Entregador não localizado, verifique o ID e tente novamente!',
      });
    };

    // checar se endereço existe
    const recipient = await Recipient.findByPk(recipient_id);

    if (!recipient) {
      return res.status(400).json({
        Erro: 'Endereço não localizado, verifique o ID ou cadastre o endereço!',
      });
    };

    const {
      id,
      signature_id,
      start_date,
      end_date,
      canceled_at,
    } = await Delivery.create({
      product,
      recipient_id,
      deliveryman_id,
      status: 'Postado',
    });

    await Queue.add(CreationDeliveryMail.key, {
      deliveryman,
      recipient,
      product,
    });

    return res.json({
      id,
      product,
      recipient_id,
      deliveryman_id,
      signature_id,
      start_date,
      end_date,
      canceled_at,
    });
  }

  async index(req, res) {
    const { filterName, page = 1 } = req.query;

    const deliveries = filterName
      ? await Delivery.findAll({
        where: {
          product: {
            [Op.iLike]: `${filterName}%`,
          },
        },
        order: ['id'],
        limit: 5,
        offset: (page - 1) * 5,
        attributes: [
          'id',
          'product',
          'status',
          'start_date',
          'end_date',
          'canceled_at',
        ],
        include: [
          {
            model: File_signature,
            as: 'signature',
            attributes: ['id', 'path', 'url'],
          },
          {
            model: Deliveryman,
            as: 'deliveryman',
            attributes: ['id', 'name'],
            include: [
              {
                model: File_avatar,
                as: 'avatar',
                attributes: ['id', 'path', 'url'],
              },
            ],
          },
          {
            model: Recipient,
            as: 'recipient',
            paranoid: false,
            attributes: [
              'id',
              'name',
              'street',
              'number',
              'city',
              'uf',
              'zip_code',
            ],
          },
        ],
      })
      : await Delivery.findAll({
        order: ['id'],
        limit: 5,
        offset: (page - 1) * 5,
        attributes: [
          'id',
          'product',
          'status',
          'start_date',
          'end_date',
          'canceled_at',
        ],
        include: [
          {
            model: File_signature,
            as: 'signature',
            attributes: ['id', 'path', 'url'],
          },
          {
            model: Deliveryman,
            as: 'deliveryman',
            attributes: ['id', 'name'],
            include: [
              {
                model: File_avatar,
                as: 'avatar',
                attributes: ['id', 'path', 'url'],
              },
            ],
          },
          {
            model: Recipient,
            as: 'recipient',
            paranoid: false,
            attributes: [
              'id',
              'name',
              'street',
              'number',
              'city',
              'uf',
              'zip_code',
            ],
          },
        ],
      });

    return res.json(deliveries);
  }

  async show(req, res) {
    const { id } = req.params;

    // Checar se a encomenda existe
    const delivery = await Delivery.findByPk(id, {
      attributes: [
        'id',
        'product',
        'status',
        'start_date',
        'end_date',
        'canceled_at',
      ],
      paranoid: false,
      include: [
        {
          model: File_signature,
          as: 'signature',
          attributes: ['id', 'path', 'url'],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name'],
          include: [
            {
              model: File_avatar,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
        {
          model: Recipient,
          as: 'recipient',
          paranoid: false,
          attributes: [
            'id',
            'name',
            'street',
            'number',
            'city',
            'uf',
            'zip_code',
          ],
        },
      ],
    });

    if (!delivery) {
      return res.status(400).json({
        Erro: 'Encomenda não existe, verifique o ID e tente novamente!',
      });
    }

    return res.json(delivery);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number(),
      product: Yup.string(),
      recipient_id: Yup.number(),
      deliveryman_id: Yup.number(),
      signature_id: Yup.number().nullable(),
      start_date: Yup.date().nullable(),
      end_date: Yup.date().nullable(),
      canceled_at: Yup.date().nullable(),
      situationStatus: Yup.number().min(1).max(4),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ Erro: 'Falha na validação!' });
    }

    const {
      id,
      product,
      recipient_id,
      deliveryman_id,
      situationStatus,
    } = req.body;

    let { signature_id } = req.body;

    // verificar se ID foi informado
    if (!id) {
      return res
        .status(400)
        .json({ Erro: 'Informe o ID para atualizar a entrega desejada!' });
    }

    // Verificar se entrega existe

    const delivery = await Delivery.findByPk(id, {
      attributes: [
        'id',
        'product',
        'status',
        'start_date',
        'end_date',
        'canceled_at',
        'deleted_at',
      ],
      include: [
        {
          model: File_signature,
          as: 'signature',
          attributes: ['id', 'path', 'url'],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email'],
          include: [
            {
              model: File_avatar,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
        {
          model: Recipient,
          as: 'recipient',
          paranoid: false,
          attributes: [
            'id',
            'name',
            'street',
            'number',
            'city',
            'uf',
            'zip_code',
          ],
        },
      ],
      paranoid: false,
    });

    if (!delivery) {
      return res.status(400).json({
        Erro: 'Entrega não existe na base de dados, verifique o ID',
      });
    };

    // Verificar se ID do avatar da assinatura é valido

    const signatureExist = await File_avatar.findByPk(signature_id);
    if (signature_id != null) {
      if (!signatureExist) {
        return res.status(400).json({ Erro: 'o ID da assinatura é invalido' });
      }
    };

    // verificar se o entregador existe

    const deliveryman = await Deliveryman.findByPk(deliveryman_id);
    if (!deliveryman) {
      return res.status(400).json({ Erro: 'o ID do entregador é invalido' });
    };

    // verificar se o endereço existe

    const recipient = await Recipient.findByPk(recipient_id);
    if (!recipient) {
      return res.status(400).json({ Erro: 'o ID do entregador é invalido' });
    };

    let { status, end_date, start_date, canceled_at, deleted_at } = delivery;
    const { startDate } = req.body;
    const startDateISO = startOfHour(parseISO(startDate));

    const { count } = await Delivery.findAndCountAll({
      where: {
        deliveryman_id,
        status: 'Retirado',
        signature_id: null,
      },
    });

    switch (situationStatus) {
      default:
        if (delivery.status === 'Entregue' && delivery.end_date != null) {
          return res
            .status(400)
            .json({ Erro: 'Entregas finalizadas, não podem ser alterada!' });
        };
        if (signature_id != null) {
          return res.status(400).json({
            Erro: 'Assinatura só pode ser informada em entregas finalizadas!',
          });
        };
        if (
          delivery.status === 'Cancelado' &&
          delivery.canceled_at != null
        ) {
          return res.status(400).json({
            Erro:
              'Entregas canceladas, só podem ser alteradas se o status for alterado!',
          });
        };

        break;
      case 1:
        if (delivery.status === 'Entregue' && delivery.end_date != null) {
          return res
            .status(400)
            .json({ Erro: 'Entregas finalizadas, não podem ser alterada!' });
        };
        if (delivery.status === 'Postado') {
          return res.status(400).json({ Erro: 'Entrega já Postada!' });
        };
        status = 'Postado';
        deleted_at = null;
        signature_id = null;
        start_date = null;
        end_date = null;
        canceled_at = null;
        break;
      case 2:
        if (delivery.status === 'Entregue' && delivery.end_date != null) {
          return res
            .status(400)
            .json({ Erro: 'Entregas finalizadas, não podem ser alterada!' });
        };
        if (delivery.status === 'Cancelado' &&
          delivery.canceled_at != null) {
          return res.status(400).json({ Erro: 'Entrega canceladas, precisam ser postadas para retirada!' });
        };
        if (delivery.status === 'Retirado' && delivery.start_date != null) {
          return res.status(400).json({ Erro: 'Entrega já Retirada!' });
        };

        if (isAfter(startDateISO, new Date())) {
          return res.status(400).json({
            Erro: 'Não é permitido retirar encomendas em datas futuras!',
          });
        };

        if (
          isBefore(startDateISO, setHours(startDateISO, 7)) ||
          isAfter(startDateISO, setHours(startDateISO, 17))
        ) {
          return res.status(400).json({
            Erro: 'Informe uma data de retirada, entre as 08:00 até as 19:59!',
          });
        };

        if (count === 5) {
          return res.status(400).json({
            Erro: 'Cada entregador pode retirar no máximo de 5 entregas!',
          });
        };

        status = 'Retirado';
        start_date = startDateISO;
        deleted_at = null;
        signature_id = null;
        end_date = null;
        canceled_at = null;
        break;
      case 3:
        if (signature_id == null) {
          return res.status(400).json({ Erro: 'informe a assinatura' });
        };
        if (delivery.status === 'Entregue' && delivery.end_date != null) {
          return res.status(400).json({ Erro: 'Entrega já finalizada!' });
        };
        if (delivery.status !== 'Retirado' || delivery.start_date == null) {
          return res
            .status(400)
            .json({ Erro: 'Entrega só pode ser finalizada, após a retirada!' });
        };
        status = 'Entregue';
        deleted_at = null;
        end_date = new Date();
        canceled_at = null;

        break;
      case 4:
        if (delivery.status === 'Entregue' && delivery.end_date != null) {
          return res
            .status(400)
            .json({ Erro: 'Entregas finalizadas, não podem ser canceladas!' });
        };
        if (
          delivery.status === 'Cancelado' &&
          delivery.canceled_at != null) {
          return res.status(400).json({ Erro: 'Entrega já cancelada!' });
        }

        status = 'Cancelado';
        deleted_at = new Date();
        signature_id = null;
        start_date = null;
        end_date = null;
        canceled_at = new Date();

        await Queue.add(CancellationDeliveryMail.key, {
          deliveryman,
          recipient,
          product: delivery.product,
        });


        break;


    };

    await delivery.update({
      id,
      product,
      recipient_id,
      deliveryman_id,
      signature_id,
      status,
      start_date,
      end_date,
      canceled_at,
      deleted_at,
    });

    return res.json(delivery);
  };

  async delete(req, res) {
    const { id } = req.params;
    // Checar se a encomenda existe
    const delivery = await Delivery.findByPk(id, {
      attributes: [
        'id',
        'product',
        'status',
        'start_date',
        'end_date',
        'canceled_at',
        'deleted_at'
      ],
      paranoid: false,
      include: [
        {
          model: File_signature,
          as: 'signature',
          attributes: ['id', 'path', 'url'],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email'],
          include: [
            {
              model: File_avatar,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
        {
          model: Recipient,
          as: 'recipient',
          paranoid: true,
          attributes: [
            'id',
            'name',
            'street',
            'number',
            'city',
            'uf',
            'zip_code',
          ],
        },
      ],
    });

    if (!delivery) {
      return res.status(400).json({
        Erro: 'Encomenda não existe, verifique o ID e tente novamente!',
      });
    };

    let { status, end_date, canceled_at, deleted_at } = delivery;

    if (delivery.status === 'Entregue' && delivery.end_date != null) {
      return res.status(400).json({
        Erro: 'Encomenda já entregue, não é possivel cancelar encomenda!',
      });
    };
    if (delivery.status === 'Cancelado' &&
      delivery.canceled_at != null) {
      return res.status(400).json({
        Erro: 'Encomenda já Cancelada!',
      });
    };

    status = 'Cancelado';
    deleted_at = new Date();
    end_date = null;
    canceled_at = new Date();

    await Queue.add(CancellationDeliveryMail.key, {
      deliveryman: delivery.deliveryma,
      recipient: delivery.recipient,
      product: delivery.product,
    });

    await delivery.update({
      id,
      status,
      end_date,
      canceled_at,
      deleted_at,
    });


    return res.json(delivery);
  }

}

export default new DeliveryController();
