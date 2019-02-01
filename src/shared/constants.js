const SPEC_FILE_NAME = 'openapi-spec.yaml';

const FEEDBACK_EMAIL = 'feedback@nightguide.app';

const USER_ROLES = {
  ROLE_STANDARD: 'standard',
  ROLE_ADMIN: 'admin',
};

const USER_GENDER_TYPES = {
  GENDER_MALE: 'male',
  GENDER_FEMALE: 'female',
  GENDER_OTHER: 'other',
};

const CLIENT_IDS = {
  CLIENT_APP: 'oaj46HciSDZ3qqi',
};

const COUNTRIES = {
  COUNTRY_NL: 'NL',
};

const VENUE_MUSIC_TYPES = {
  MUSIC_TECHNO: 'techno',
  MUSIC_DANCE: 'dance',
  MUSIC_LIVE: 'live',
  MUSIC_VARYING: 'varying',
  MUSIC_JAZZ: 'jazz',
};

const VENUE_VISITOR_TYPES = {
  VISITOR_STUDENT: 'students',
  VISITOR_YOUNG_PROFESSIONAL: 'young_professionals',
};

const VENUE_CATEGORIES = {
  CATEGORY_CLUB: 'club',
  CATEGORY_BAR: 'bar',
  CATEGORY_LOUNGE: 'lounge',
  CATEGORY_SPECIAL_BEER_BAR: 'special_beer_bar',
  CATEGORY_COCKTAIL_BAR: 'cocktail_bar',
  CATEGORY_CONCERT_VENUE: 'concert_venue',
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

const VENUE_PAYMENT_METHODS = {
  METHOD_CREDITCARD: 'creditcard',
  METHOD_DEBITCARD: 'debitcard',
  METHOD_CASH: 'cash',
};

module.exports = {
  SPEC_FILE_NAME,
  CLIENT_IDS,
  USER_ROLES,
  COUNTRIES,
  VENUE_PAYMENT_METHODS,
  USER_GENDER_TYPES,
  FEEDBACK_EMAIL,
  VENUE_CATEGORIES,
  VENUE_PRICE_CLASSES,
  VENUE_DOORPOLICIES,
  VENUE_MUSIC_TYPES,
  VENUE_VISITOR_TYPES,
};
