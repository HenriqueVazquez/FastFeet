import Mail from '../../lib/Mail';

class CancellationDeliveryMail {
  get key() {
    return 'CreationDeliveryMail';
  }

  async handle({ data }) {
    const { deliveryman, product, recipient } = data;

    console.log('A fila executou');

    await Mail.sendMail({
      to: `${deliveryman.name} <${deliveryman.email}>`,
      subject: 'Nova Encomenda cadastrada!',
      template: 'CreationDelivery',
      context: {
        deliveryman: deliveryman.name,
        product,
        recipient: recipient.name,
        city: recipient.city,
        uf: recipient.uf,
        street: recipient.street,
        number: recipient.number,
        zip_code: recipient.zip_code,
      }
    });
  }
}

export default new CancellationDeliveryMail();
