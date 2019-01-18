const exphbs = require('express-handlebars');

const helpers = {
  ifeq: function(a, b, options) {
    if (a === b) {
      return options.fn(this);
    }
    return options.inverse(this);
  },
};

const hbs = exphbs.create({
  helpers,
  extname: '.hbs',
});

module.exports = hbs;
