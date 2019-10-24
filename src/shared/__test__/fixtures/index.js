module.exports = {
  ...require('./userFixtures'),
  ...require('./venueFixtures'),
  ...require('./eventFixtures'),
  ...require('./locationFixtures'),
  ...require('./artistFixtures'),
  ...require('./tagFixtures'),
  ...require('./contentFixtures'),
  ...require('./configFixtures'),
  ...require('./orderFixtures'),
  IMAGE_FIXTURE_PATH: 'src/shared/__test__/fixtures/media/square.jpg',
  PDF_FIXTURE_PATH: 'src/shared/__test__/fixtures/media/blank.pdf',
};
