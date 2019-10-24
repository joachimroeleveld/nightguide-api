const i18next = require('i18next');
const Backend = require('i18next-node-fs-backend');

let t;

function init() {
  return i18next
    .use(Backend)
    .init({
      lng: 'en',
      ns: ['emails'],
      backend: {
        loadPath: 'locales/{{lng}}/{{ns}}.json',
        addPath: 'locales/{{lng}}/{{ns}}.missing.json',
        jsonIndent: 2,
      },
    })
    .then(tFunc => {
      t = tFunc;
    })
    .catch(console.err);
}

const __ = (...args) => t(...args);

module.exports = {
  __,
  init,
};
