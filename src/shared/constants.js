const SPEC_FILE_NAME = 'openapi-spec.yaml';

const USER_ROLES = {
  ROLE_STANDARD: 'standard',
  ROLE_ADMIN: 'admin',
};

const USER_GENDER_TYPES = {
  GENDER_MALE: 'male',
  GENDER_FEMALE: 'female',
  GENDER_OTHER: 'other',
};

const VENUE_CATEGORIES = {
  CATEGORY_LOUNGE: 'lounge',
};

const VENUE_PRICE_CLASSES = {
  CLASS_1: 1,
  CLASS_2: 1,
  CLASS_3: 1,
  CLASS_4: 1,
};

const VENUE_DOORPOLICIES = {
  POLICY_MODERATE: 'moderate',
  POLICY_STRICT: 'strict',
  POLICY_GUESTLIST: 'guestlist',
};

const COUNTRIES = {
  COUNTRY_NL: 'NL',
};

const TAG_TYPES = {
  TAG_MUSIC_GENRE: 1,
};

const PAYMENT_METHODS = {
  METHOD_CREDITCARD: 'creditcard',
  METHOD_DEBITCARD: 'debitcard',
  METHOD_CASH: 'cash',
};

module.exports = {
  SPEC_FILE_NAME,
  USER_ROLES,
  VENUE_CATEGORIES,
  VENUE_PRICE_CLASSES,
  COUNTRIES,
  TAG_TYPES,
  VENUE_DOORPOLICIES,
  PAYMENT_METHODS,
  USER_GENDER_TYPES,
};
