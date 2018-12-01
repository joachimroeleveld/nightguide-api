const { getUserById } = require('../routes/users/userRepository');
const jwt = require('jsonwebtoken');

const { UnauthorizedError } = require('../shared/errors');

function getUserFromToken(token) {
  return new Promise((resolve, reject) => {
    if (!token) {
      return reject(new UnauthorizedError('invalid_token'));
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err instanceof jwt.TokenExpiredError) {
        reject(new UnauthorizedError('token_expired'));
      } else if (err) {
        reject(new UnauthorizedError('invalid_token'));
      }

      const user = await getUserById(decoded.sub);

      if (!user) {
        reject(new UnauthorizedError('invalid_token'));
      }

      resolve(user);
    });
  });
}

module.exports = {
  getUserFromToken,
};
