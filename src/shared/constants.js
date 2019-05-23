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
  CLIENT_APP: 'app',
  CLIENT_WEBSITE: 'website',
};

const COUNTRIES = {
  COUNTRY_NL: 'NL',
  COUNTRY_BE: 'BE',
};

const VENUE_MUSIC_TYPES = {
  MUSIC_TECHNO: 'techno',
  MUSIC_DANCE: 'dance',
  MUSIC_LIVE: 'live',
  MUSIC_VARYING: 'varying',
  MUSIC_JAZZ: 'jazz',
  MUSIC_APRES_SKI: 'apres_ski',
  MUSIC_COUNTRY: 'country',
  MUSIC_FOLK: 'folk',
  MUSIC_HOUSE: 'house',
  MUSIC_LOUNGE: 'lounge',
  MUSIC_NO_MUSIC: 'no_music',
  MUSIC_HIPHOP: 'hip_hop',
  MUSIC_ROCK: 'rock',
  MUSIC_CLASSICAL: 'classical',
  MUSIC_80_90: '80s_90s',
  MUSIC_DISCO: 'disco',
  MUSIC_LATIN: 'latin',
  MUSIC_ELECTRO: 'electro',
};

const VENUE_VISITOR_TYPES = {
  VISITOR_TEENAGER: 'teenagers',
  VISITOR_SENIOR: 'seniors',
  VISITOR_STUDENT: 'students',
  VISITOR_YOUNG_PROFESSIONAL: 'young_professionals',
  VISITOR_MIDDLE_AGED: 'middle_aged',
  VISITOR_VARYING: 'varying',
  VISITOR_INTERNATIONAL: 'international',
  VISITOR_LOCALS: 'locals',
  VISITOR_LGBTQ: 'lgbtq',
};

const VENUE_CATEGORIES = {
  CATEGORY_CLUB: 'club',
  CATEGORY_BAR: 'bar',
  CATEGORY_DANCING_BAR: 'dancing_bar',
  CATEGORY_BEACH_CLUB: 'beach_club',
  CATEGORY_LOUNGE: 'lounge_bar',
  CATEGORY_CRAFT_BEER_BAR: 'craft_beer_bar',
  CATEGORY_COCKTAIL_BAR: 'cocktail_bar',
  CATEGORY_CONCERT_VENUE: 'concert_venue',
  CATEGORY_STRIP_CLUB: 'strip_club',
  CATEGORY_BLUES_BAR: 'blues_bar',
  CATEGORY_CASINO: 'casino',
  CATEGORY_COMEDY_BAR: 'comedy_bar',
  CATEGORY_COUNTRY_BAR: 'country_bar',
  CATEGORY_HOOKAH_BAR: 'hookah_bar',
  CATEGORY_IRISH_PUB: 'irish_pub',
  CATEGORY_JAZZ_BAR: 'jazz_bar',
  CATEGORY_KARAOKE_BAR: 'karaoke_bar',
  CATEGORY_LGBTQ_BAR: 'lgbtq_bar',
  CATEGORY_PIANO_BAR: 'piano_bar',
  CATEGORY_SPORTS_BAR: 'sports_bar',
  CATEGORY_WINE_BAR: 'wine_bar',
  CATEGORY_WHISKY_BAR: 'whisky_bar',
};

const VENUE_DOORPOLICIES = {
  POLICY_MODERATE: 'moderate',
  POLICY_STRICT: 'strict',
  POLICY_GUESTLIST: 'guestlist',
};

const VENUE_PAYMENT_METHODS = {
  METHOD_CREDIT_CARD: 'credit_card',
  METHOD_DEBIT_CARD: 'debit_card',
  METHOD_CASH: 'cash',
};

const VENUE_DRESSCODES = {
  DRESSCODE_CHIQUE: 'chique',
  DRESSCODE_ALTERNATIVE: 'alternative',
};

const VENUE_FACILITIES = {
  FACILITY_VIP: 'vip_area',
  FACILITY_SMOKING_AREA: 'smoking_area',
  FACILITY_BOUNCERS: 'bouncers',
  FACILITY_KITCHEN: 'kitchen',
  FACILITY_COAT_CHECK: 'coat_check',
  FACILITY_PARKING: 'parking',
  FACILITY_CIGARETTES: 'cigarettes',
  FACILITY_ACCESSIBLE: 'accessible',
  FACILITY_TERRACE: 'terrace',
  FACILITY_TERRACE_HEATERS: 'terrace_heaters',
};

const VENUE_IMAGE_PERSPECTIVES = [
  'front_bar',
  'front_venue',
  'front_stage',
  'from_bar',
  'from_stage',
  'atmosphere',
];

const VENUE_CAPACITY_RANGES = [1, 50, 200, 500, 1000, 5000, 10000];

module.exports = {
  SPEC_FILE_NAME,
  CLIENT_IDS,
  USER_ROLES,
  COUNTRIES,
  VENUE_PAYMENT_METHODS,
  USER_GENDER_TYPES,
  FEEDBACK_EMAIL,
  VENUE_CATEGORIES,
  VENUE_DOORPOLICIES,
  VENUE_MUSIC_TYPES,
  VENUE_VISITOR_TYPES,
  VENUE_DRESSCODES,
  VENUE_FACILITIES,
  VENUE_IMAGE_PERSPECTIVES,
  VENUE_CAPACITY_RANGES,
};
