/**
 * Represent an error that is supposed to be exposed to the service consumer. Should not be instantiated directly, extend it and throw the more specific subclasses
 * @class PublicError
 *
 * @extends {Error}
 */
class PublicError extends Error {
  /**
   *
   * @param {number} status - status code
   * @param {string} message - text description of the error
   */
  constructor(status, message) {
    super(message);
    this.statusCode = status;
  }
}

module.exports = PublicError;
