const { TEST_USER_1 } = require('../../shared/__test__/fixtures/userFixtures');
const auth = require('../../framework/auth');
const User = require('../../routes/users/userModel');

function mockUserAuth(sandbox = global.sandbox) {
  const user = new User(TEST_USER_1);
  user.checkRole = sandbox.stub().returns(true);
  sandbox.stub(auth, 'getUserFromToken').resolves(user);
}

function restoreUserAuth() {
  auth.getUserFromToken.restore();
}

module.exports = {
  mockUserAuth,
  restoreUserAuth,
};
