const PointSchema = (required = false) => ({
  type: {
    type: String,
    enum: ['Point'],
    required,
  },
  coordinates: {
    type: [Number],
    required,
    default: undefined,
  },
});

const TranslatedSchema = () => ({
  en: String,
  nl: String,
});

module.exports = {
  PointSchema,
  TranslatedSchema,
};
