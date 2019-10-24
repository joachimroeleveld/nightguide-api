const React = require('react');
const _ = require('lodash');

const orderRepository = require('../../orders/orderRepository');
const venueRepository = require('../../venues/venueRepository');
const ticketsTemplate = require('../../../shared/templates/pdf/tickets');

async function getTicketsForOrder(event, order) {
  // Create array for every item times quantity
  const items = order.items.reduce((items, item) => {
    const product = _.find(event.tickets.products, { id: item.sku });
    if (!product) return items;
    return items.concat(Array(item.quantity).fill(item));
  }, []);

  const codes = _.get(order, 'metadata.ticketCodes') || [];

  if (!codes.length) {
    for (const item of items) {
      const code = await venueRepository.redeemVenueTicketCode(
        event.organiser.venue.id
      );
      codes.push(code);
    }
    await orderRepository.updateOrderMeta(order._id, 'ticketCodes', codes);
  }

  const products = items.map(({ sku }) =>
    _.find(event.tickets.products, { id: sku })
  );

  return generateTicketsPdf(items, codes, products, event, order);
}

function generateDownloadsKey() {
  return Math.random()
    .toString(36)
    .substring(2, 15);
}

function generateTicketsPdf(items, codes, products, event, order) {
  const tickets = _.zip(items, codes, products).map(
    ([item, code, product]) => ({
      ticketCode: code,
      name: order.billingDetails.name,
      eventName: (event.facebook || {}).title || event.title,
      dateFrom: event.dates[0].from,
      dateTo: event.dates[0].to,
      orderId: order.id,
      venue: event.organiser.venue.name,
      currency: order.currency,
      productName: product.name,
      price: item.price,
      quantity: item.quantity,
    })
  );

  return ticketsTemplate.render({ tickets });
}

module.exports = {
  generateDownloadsKey,
  getTicketsForOrder,
};
