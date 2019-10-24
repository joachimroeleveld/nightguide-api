module.exports = {
  collectCoverage: false,
  notify: true,
  verbose: true,
  clearMocks: true,
  testEnvironment: 'node',
  transform: {
    '\\.jsx$': 'babel-jest',
  },
};
