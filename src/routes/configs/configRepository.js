const Config = require('./configModel');
const _ = require('lodash');
const { NotFoundError } = require('../../shared/errors');
const { serialize, deserialize } = require('./lib/serialization');
const { match } = require('./lib/aggregation');

async function getConfigs(opts = {}, withCount = false) {
  const { offset, limit, ...filters } = opts;

  const createAgg = () => {
    const agg = Config.aggregate();
    return match(agg, filters);
  };

  let countAgg;
  if (withCount) {
    countAgg = createAgg();
    countAgg.group({
      _id: null,
      totalCount: { $sum: 1 },
    });
  }

  const agg = createAgg();

  agg.sort({ name: 1 });

  if (offset) {
    agg.append({
      $skip: offset,
    });
  }
  if (limit) {
    agg.limit(limit);
  }

  const results = await agg.exec();

  if (withCount) {
    const countResult = await countAgg.exec();
    const count = (countResult.length && countResult[0].totalCount) || 0;
    return { totalCount: count, results };
  } else {
    return results;
  }
}

async function getConfig(configId, opts = {}) {
  return await Config.findById(configId).exec();
}

async function createConfig(data) {
  return Config.create(data);
}

async function updateConfig(conditions, data, options = {}) {
  let where = conditions;
  if (_.isString(conditions)) {
    where = { _id: conditions };
  }
  const config = await Config.findOneAndUpdate(where, data, {
    new: true,
    runValidators: true,
    ...options,
  }).exec();

  if (!config) {
    throw new NotFoundError('config_not_found');
  }

  return config;
}

async function deleteConfig(id, opts) {
  return Config.findByIdAndRemove(id, opts).exec();
}

async function getConfigByName(name, pageSlug) {
  return await Config.findOne({
    name,
    pageSlug,
  }).exec();
}

module.exports = {
  getConfigs,
  createConfig,
  getConfig,
  updateConfig,
  deleteConfig,
  getConfigByName,
  serialize,
  deserialize,
};
