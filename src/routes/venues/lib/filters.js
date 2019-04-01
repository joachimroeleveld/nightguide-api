function applyFilterOnQuery(
  query,
  {
    cat,
    priceClass,
    musicType,
    visitorType,
    dresscode,
    paymentMethod,
    doorPolicy,
    cap,
    bouncers,
    noBouncers,
    parking,
    accessible,
    vip,
    noEntranceFee,
    kitchen,
    coatCheck,
    noCoatCheckFee,
    smoking,
    cigarettes,
    terrace,
    heatedTerrace,
  }
) {
  if (cat) {
    query.where('categories', cat);
  }
  if (musicType) {
    query.where('musicTypes', musicType);
  }
  if (visitorType) {
    query.where('visitorTypes', visitorType);
  }
  if (dresscode) {
    query.where('dresscode', dresscode);
  }
  if (paymentMethod) {
    query.where('paymentMethods', paymentMethod);
  }
  if (doorPolicy) {
    query.where('doorPolicy.policy', doorPolicy);
  }
}

module.exports = {
  applyFilterOnQuery,
};
