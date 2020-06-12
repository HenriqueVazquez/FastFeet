import { Op } from 'sequelize';
import * as Yup from 'yup';
import { parseISO, isAfter, isBefore, setHours, startOfHour } from 'date-fns';

import Deliveryman from '../models/Deliveryman';
import Delivery from '../models/Delivery';
import Recipient from '../models/Recipient';
import File_avatar from '../models/File_avatar';
import File_signature from '../models/File_signature';

class DeliverymanDeliveryController {
  async index(req, res) {
    const { id: deliveryman_id } = req.params;
    const { delivered } = req.query;

    const deliveryman = await Deliveryman.findByPk(deliveryman_id, {
      attributes: ['id', 'name'],
      include: [
        {
          model: File_avatar,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    if (!deliveryman) {
      return res
        .status(400)
        .json({ Erro: 'Entregador não localizado, verifique o ID informado!' });
    }

    if (delivered && delivered === 'true') {
      const deliveries = await Delivery.findAll({
        where: {
          deliveryman_id: deliveryman_id,
          signature_id: { [Op.not]: null },
          canceled_at: null,
        },
        order: ['id'],
        attributes: [
          'id',
          'deliveryman_id',
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
      const deliverymanDeliveries = [];
      deliverymanDeliveries.push(deliveryman);
      deliverymanDeliveries.push(deliveries);

      return res.json(deliverymanDeliveries);
    }

    const deliveries = await Delivery.findAll({
      where: {
        deliveryman_id: deliveryman_id,
        signature_id: null,
        canceled_at: null,
      },
      order: ['id'],
      attributes: [
        'id',
        'deliveryman_id',
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

    const deliverymanDeliveries = [];
    deliverymanDeliveries.push(deliveryman);
    deliverymanDeliveries.push(deliveries);

    return res.json(deliverymanDeliveries);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number().required(),
      start_date: Yup.date().required(),
    });

    if(!(await schema.isValid(req.body))){
      return res.status(400).json({ Erro: 'Erro na validação!' });
    }

    const { id: delivery_id, start_date } = req.body;
    const { id: deliveryman_id } = req.params;


    const deliveryman = await Deliveryman.findByPk(deliveryman_id);

    if (!deliveryman) {
      return res
        .status(400)
        .json({ Erro: 'Entregador não localizado, verifique o ID informado!' });
    }

    const startDateISO = startOfHour(parseISO(start_date));

    const delivery = await Delivery.findByPk(delivery_id, {
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
      return res
        .status(400)
        .json({ Erro: 'Entrega não localizada, verifique o ID!' });
    };
    if (delivery.deliveryman.id != deliveryman_id) {
      return res
        .status(400)
        .json({ Erro: 'Entrega não cadastrada para o ID do entregador informado!' });
    };

    if (delivery.status === 'Entregue' && delivery.end_date != null) {
      return res
        .status(400)
        .json({ Erro: 'Entrega já finalizadas!' });
    };
    if (delivery.status === 'Cancelado' &&
        delivery.canceled_at != null &&
        delivery.deleted_at != null) {
          return res.status(400).json({ Erro: 'Entrega canceladas, precisam ser postadas para retirada!' });
        };

    if (delivery.status === 'Retirado' && delivery.start_date != null) {
      return res.status(400).json({ Erro: 'Entrega já retirada!' });
    };

      const { count } = await Delivery.findAndCountAll({
        where: {
          deliveryman_id,
          status: 'Retirado',
          signature_id: null,
        },
      });

      if (count === 5) {
        return res.status(400).json({
          Erro: 'Cada entregador pode retirar no máximo de 5 entregas!',
        });
      };

      if (
        isBefore(startDateISO, setHours(new Date, 7)) ||
        isAfter(startDateISO,  setHours(new Date , 17))
      ) {
        return res.status(400).json({
          Erro: 'Informe uma data de retirada, entre as 08:00 até as 19:59!',
        });
      };

      await delivery.update({
        status: 'Retirado',
        start_date: startDateISO,
      });




      return res.json([{Info: 'Entrega retirada!'}, delivery]);
  }
}

export default new DeliverymanDeliveryController();

