module.exports = {
  users: require('./users/userRouter'),
  venues: require('./venues/venueRouter'),
  events: require('./events/eventRouter'),
  health: require('./healthRouter'),
  misc: require('./misc/miscRouter'),
  tags: require('./tags/tagRouter'),
};
