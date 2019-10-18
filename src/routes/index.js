module.exports = {
  users: require('./users/userRouter'),
  venues: require('./venues/venueRouter'),
  events: require('./events/eventRouter'),
  health: require('./healthRouter'),
  misc: require('./misc/miscRouter'),
  tags: require('./tags/tagRouter'),
  artists: require('./artists/artistRouter'),
  configs: require('./configs/configRouter'),
  content: require('./content/contentRouter'),
  orders: require('./orders/orderRouter'),
};
