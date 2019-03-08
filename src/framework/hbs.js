const exphbs = require('express-handlebars');
const path = require('path');

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
  partialsDir: path.resolve(__dirname, '../shared/templates/mail'),
});

module.exports = hbs;
