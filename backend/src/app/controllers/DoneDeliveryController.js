import * as Yup from 'yup';
import Deliveryman from '../models/Deliveryman';
import Delivery from '../models/Delivery';
import File_signature from '../models/File_signature';
import File_avatar from '../models/File_avatar';
import Recipient from '../models/Recipient';

class DoneDeliveryController {
  async update(req, res) {
    const schema =  Yup.object().shape({
      id: Yup.number().required(),
      signature_id: Yup.number().required(),
    });

    if(!(await schema.isValid(req.body))) {
      return res.status(400).json({ Erro: 'Erro na validação'});
    }

    const { id: deliveryman_id } = req.params;
    const { id: delivery_id, signature_id } = req.body;

    // Verificar se o entregador existe

    const deliveryman = await Deliveryman.findByPk(deliveryman_id);

    if (!deliveryman) {
      return res.status(400).json({ Erro: 'Entregador não localizado, verifique o ID!' })
    }

    //verificar se a entrega existe

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
      return res.status(400).json({ Erro: 'Entrega não localizada, verifique o ID!' });
    };

    if (delivery.deliveryman.id != deliveryman_id) {
      return res
        .status(400)
        .json({ Erro: 'Entrega não cadastrada para o ID do entregador informado!' });
    };

    if (delivery.status === 'Postado' && delivery.start_date === null) {
      return res.status(400).json({ Erro: 'Entrega só pode ser finalizada, após a retirada!' });
    };

    if (delivery.status === 'Entregue' && delivery.end_date != null) {
      return res
        .status(400)
        .json({ Erro: 'Entrega já finalizadas!' });
    };

    if (delivery.status === 'Cancelado' ||
      delivery.canceled_at != null ||
      delivery.deleted_at != null) {
      return res.status(400).json({ Erro: 'Entrega cancelada!' });
    };

    const signature = await File_signature.findByPk(signature_id);

    if (!signature) {
      return res.status(400).json({Erro: 'Assinatura não localizada, verifique o ID!'})
    }

    await delivery.update({
      end_date: new Date(),
      signature_id,
      status: 'Entregue',
    });

    return res.json([{Info: 'Entrega finalizada'}, delivery]);
  }

}

export default new DoneDeliveryController();
