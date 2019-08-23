const { deepFreeze } = require('../../util/objects');

const TEST_CONTENT_1 = deepFreeze({
  _id: '5d1b07de18f84579f86064b2',
  title: { en: 'Pretty interesting article' },
  pageSlug: 'nl/utrecht',
});

const TEST_CONTENT_2 = deepFreeze({
  _id: '5d1b077518f84579f8600767',
  title: { en: 'Another article' },
  pageSlug: 'es/ibiza',
});

module.exports = {
  TEST_CONTENT_1,
  TEST_CONTENT_2,
};
