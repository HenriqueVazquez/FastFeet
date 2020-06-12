import * as Yup from 'yup';

import deliveryProblemIntersect from '../../util/ArrayIntersect';

import Delivery from '../models/Delivery';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';
import File_avatar from '../models/File_avatar';
import File_signature from '../models/File_signature';

import Queue from '../../lib/Queue';
import CancellationProblemDeliveryMail from '../jobs/CancellationProblemDeliveryMail';

import DeliveryProblem from '../schemas/DeliveryProblem';




class DeliveryProblemController {
  async store(req, res) {
    const schema = Yup.object().shape({
      description: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ Erro: 'Falha na validação!' });
    }

    const { id } = req.params;

    const delivery = await Delivery.findByPk(id, { paranoid: false });

    if (!delivery) {
      return res
        .status(400)
        .json({ Erro: 'Entrega não localizada, verifique o ID!' });
    }

    if (delivery.canceled_at) {
      return res.status(400).json({ Erro: 'Entrega já foi cancelada!' });
    }

    if (!delivery.start_date) {
      return res.status(400).json({ Erro: 'Entrega não foi retirada!' });
    }

    const { description } = req.body;

    const deliveryProblem = await DeliveryProblem.create({
      delivery_id: id,
      description,
    });

    return res.json(deliveryProblem);
  }

  async index(req, res) {
    const { page = 1 } = req.query;
    const deliveryProblems = await DeliveryProblem.find()
      .skip((page - 1) * 5)
      .limit(5);

    const deliveriesId = deliveryProblems.map(delivery => delivery.delivery_id);
    const deliveries = await Promise.all(
      deliveriesId.map(async delivery_id =>
        Delivery.findByPk(delivery_id, {
          attributes: ['product', 'start_date', 'end_date', 'canceled_at'],
          include: [
            {
              model: Recipient,
              as: 'recipient',
              attributes: [
                'id',
                'name',
                'street',
                'number',
                'uf',
                'city',
                'zip_code',
              ],
            },
            {
              model: Deliveryman,
              as: 'deliveryman',
              attributes: ['id', 'name'],
              include: [
                {
                  model: File_avatar,
                  as: 'avatar',
                  attributes: ['id', 'url', 'path'],
                },
              ],
            },
            {
              model: File_signature,
              as: 'signature',
              attributes: ['id', 'url', 'path'],
            },
          ],
        })
      )
    );

    return res.json(deliveryProblemIntersect(deliveryProblems, deliveries));
  }

  async show(req, res) {
    const { id } = req.params;

    const delivery = await Delivery.findByPk(id, {
      attributes: ['product', 'start_date', 'end_date', 'canceled_at'],
      paranoid: false,
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'id',
            'name',
            'street',
            'number',
            'uf',
            'city',
            'zip_code',
          ],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name'],
          include: [
            {
              model: File_avatar,
              as: 'avatar',
              attributes: ['id', 'url', 'path'],
            },
          ],
        },
        {
          model: File_signature,
          as: 'signature',
          attributes: ['id', 'url', 'path'],
        },
      ],
    });

    if (!delivery) {
      return res
        .status(400)
        .json({ Erro: 'Entrega não localizada, verifique o ID!' });
    }

    await DeliveryProblem.update(
      { delivery_id: id },
      { $set: { read: true } },
      { multi: true }
    );

    const deliveryProblem = await DeliveryProblem.find({ delivery_id: id });

    const deliveryProblemInfo = [];
    deliveryProblemInfo.push(deliveryProblem, delivery);

    return res.json(deliveryProblemInfo);
  }

  async delete(req, res) {
    const { id } = req.params;

    const { delivery_id, description } = await DeliveryProblem.findById(id);

    const delivery = await Delivery.findByPk(delivery_id, {
      include: [
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Recipient,
          as: 'recipient',
        },
      ],
    });

    if (delivery.status === 'Cancelado' &&
      delivery.canceled_at != null) {
      res.status(400).json({ Erro: 'Encomenda já foi cancelada' })
    };

    if (delivery.status === 'Entregue' && delivery.end_date != null) {
      return res.status(400).json({
        Erro: 'Encomenda já entregue, não é possivel cancelar encomenda!',
      });
    };

    await Queue.add(CancellationProblemDeliveryMail.key, {
      deliveryman: delivery.deliveryman,
      description,
      recipient: delivery.recipient,
      product: delivery.product,
    });


    await delivery.update({ canceled_at: new Date(), status: 'Cancelado' });
    await DeliveryProblem.update(
      { delivery_id },
      { $set: { canceled_at: true } },
      { multi: true });




    return res.json({ info: `entrega com id ${delivery_id} cancelada` });
  }
}

export default new DeliveryProblemController();
