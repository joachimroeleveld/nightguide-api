const { deepFreeze } = require('../../util/objects');

const TEST_CONFIG_1 = deepFreeze({
  _id: '5d3abf5718f84579f8249558',
  name: 'Config A',
  payload: {
    setting: 1,
  },
});

const TEST_CONFIG_2 = deepFreeze({
  _id: '5d3ad85118f84579f835dd77',
  name: 'Config B',
  payload: {
    setting: 2,
  },
});

const TEST_CONFIG_3 = deepFreeze({
  _id: '5d3ad87e18f84579f8361764',
  name: 'Config C',
  payload: {
    setting: 3,
  },
});

module.exports = {
  TEST_CONFIG_1,
  TEST_CONFIG_2,
  TEST_CONFIG_3,
};
