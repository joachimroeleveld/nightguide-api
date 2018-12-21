const { USER_GENDER_TYPES } = require('../../constants');

const TEST_USER_1 = Object.freeze({
  _id: '5c001cac8e84e1067f34695c',
  email: 'alice@rogers.nl',
  password: 'test-password',
  firstName: 'Alice',
  lastName: 'Rogers',
  birthday: '1995-10-04',
  gender: USER_GENDER_TYPES.GENDER_FEMALE,
});

const TEST_USER_2 = Object.freeze({
  _id: '5c0261a0801b80bed2f047dd',
  email: 'bart@holister.nl',
  password: 'foobar',
  firstName: 'Bart',
  lastName: 'Holister',
  birthday: '1980-03-15',
  gender: USER_GENDER_TYPES.GENDER_MALE,
});

module.exports = {
  TEST_USER_1,
  TEST_USER_2,
};
