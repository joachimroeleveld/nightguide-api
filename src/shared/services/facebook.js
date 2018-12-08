const request = require('request-promise');
const addSeconds = require('date-fns/add_seconds');
const UnauthorizedError = require('../errors/UnauthorizedError');

class FacebookApi {
  constructor(accessToken = null) {
    this.accessToken = accessToken;
  }

  async getAccessToken(exchangeToken) {
    try {
      const {
        access_token: accessToken,
        expires_in: expiresIn,
      } = await this._apiRequest({
        uri: `/oauth/access_token`,
        qs: {
          grant_type: 'fb_exchange_token',
          client_id: process.env.FACEBOOK_CLIENT_ID,
          client_secret: process.env.FACEBOOK_CLIENT_SECRET,
          fb_exchange_token: exchangeToken,
        },
      });

      this.accessToken = accessToken;

      return {
        accessToken,
        expiresIn: addSeconds(new Date(), expiresIn),
      };
    } catch (e) {
      throw new UnauthorizedError('invalid_exchange_token');
    }
  }

  async getMe(fields = []) {
    return await this._apiRequest({
      uri: `/me?fields=${fields.join(',')}`,
    });
  }

  async _apiRequest(opts) {
    const { uri, qs = {} } = opts;

    if (this.accessToken) {
      qs.access_token = this.accessToken;
    }

    return await request({
      baseUrl: 'https://graph.facebook.com/',
      uri: uri,
      qs,
      json: true,
    });
  }
}

module.exports = FacebookApi;
