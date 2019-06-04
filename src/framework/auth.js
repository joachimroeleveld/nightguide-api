const jwt = require('jsonwebtoken');

const { CLIENT_IDS } = require('../shared/constants');
const config = require('../shared/config');
const { getUser } = require('../routes/users/userRepository');
const { UnauthorizedError } = require('../shared/errors');

function getUserFromToken(token) {
  return new Promise((resolve, reject) => {
    if (!token) {
      return reject(new UnauthorizedError('invalid_token'));
    }

    jwt.verify(token, config.get('JWT_SECRET'), async (err, decoded) => {
      if (err instanceof jwt.TokenExpiredError) {
        return reject(new UnauthorizedError('token_expired'));
      } else if (err) {
        return reject(new UnauthorizedError('invalid_token'));
      }

      const user = await getUser(decoded.sub);

      if (!user) {
        return reject(new UnauthorizedError('invalid_token'));
      }

      resolve(user);
    });
  });
}

function getClientId(req) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey === 'nyfuUiZg9D@G^CFX^LtB') {
    return CLIENT_IDS.CLIENT_WEBSITE;
  }
  if (apiKey === 'A%VFhkJe!MMIqEf*5Cq7') {
    return CLIENT_IDS.CLIENT_ADMIN;
  }
  return null;
}

module.exports = {
  getUserFromToken,
  getClientId,
};
