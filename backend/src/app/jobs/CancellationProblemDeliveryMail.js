import Mail from '../../lib/Mail';

class CancellationProblemDeliveryMail {
  get key() {
    return 'CancellationProblemDeliveryMail';
  }

  async handle({ data }) {
    const { deliveryman, product, recipient, description } = data;

    console.log('A fila executou');

    await Mail.sendMail({
      to: `${deliveryman.name} <${deliveryman.email}>`,
      subject: 'Uma encomenda foi cancelada devido a problemas!',
      template: 'ProblemDelivery',
      context: {
        description,
        deliveryman: deliveryman.name,
        product,
        recipient: recipient.name,
        city: recipient.city,
        uf: recipient.uf,
        street: recipient.street,
        number: recipient.number,
        zip_code: recipient.zip_code,
      },
    });
  }
}

export default new CancellationProblemDeliveryMail();
