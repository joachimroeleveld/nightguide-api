/**
 * Represent an error that is supposed to be exposed to the service consumer. Should not be instantiated directly, extend it and throw the more specific subclasses
 * @class PublicError
 *
 * @extends {Error}
 */
class PublicError extends Error {
  constructor(status, type, message) {
    super(message);
    this.type = type;
    this.statusCode = status;
  }
}

module.exports = PublicError;
