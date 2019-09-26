const unidecode = require('unidecode');
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const _ = require('lodash');
const cityConfig = require('../../../shared/cityConfig');

function match(
  agg,
  {
    textFilter,
    isFbEvent,
    dateFrom,
    dateTo,
    createdAfter,
    createdBefore,
    venue,
    country,
    city,
    ids,
    tag,
    artist,
    exclude,
    tagged,
    datesChanged,
    tags,
    pageSlug,
    showHidden,
  }
) {
  const match = { $and: [] };

  // Default filters
  if (!showHidden) {
    match['admin.hide'] = { $ne: true };
  }

  if (textFilter && textFilter.length > 2) {
    match.queryText = new RegExp(`\\b${unidecode(textFilter)}`, 'i');
  }
  if (ids) {
    match._id = { $in: ids.map(id => mongoose.Types.ObjectId(id)) };
  }
  if (exclude) {
    match._id = { $nin: exclude.map(id => mongoose.Types.ObjectId(id)) };
  }
  if (tag) {
    match['tags'] = { $in: tag.map(id => mongoose.Types.ObjectId(id)) };
  }
  if (pageSlug) {
    match['pageSlug'] = pageSlug;
  }
  if (artist) {
    const artistIds = artist.map(id => mongoose.Types.ObjectId(id));
    match.$and.push({
      $or: [
        { 'date.artists': { $in: artistIds } },
        { artists: { $in: artistIds } },
      ],
    });
  }
  if (city) {
    match['location.city'] = city;
  }
  if (country) {
    match['location.country'] = country;
  }
  if (venue) {
    match['organiser.venue'] = {
      $in: venue.map(id => mongoose.Types.ObjectId(id)),
    };
  }
  if (isFbEvent) {
    match['facebook.id'] = { $exists: true };
  }
  if (dateFrom || dateTo) {
    let timezone;
    if (pageSlug) {
      timezone = (cityConfig[pageSlug] || {}).timezone;
    }
    _.mergeWith(
      match,
      matchDateRange(dateFrom, dateTo, timezone),
      (objValue, srcValue) =>
        Array.isArray(objValue) ? objValue.concat(srcValue) : undefined
    );
  }
  if (createdAfter) {
    match['createdAt'] = { $gte: createdAfter };
  }
  if (createdBefore) {
    match['createdAt'] = { $lt: createdBefore };
  }
  if (tags) {
    agg.addFields(getTagMatchScoreFieldExpr(tags));
    agg.match({ tagsMatchScore: { $gte: 1 } });
  }
  if (tagged !== undefined) {
    match['tags.0'] = { $exists: tagged };
  }
  if (datesChanged !== undefined) {
    match['facebook.datesChanged'] = datesChanged;
  }

  if (!match.$and.length) {
    delete match.$and;
  }

  agg.match(match);

  return agg;
}

function getTagMatchScoreFieldExpr(tags) {
  return {
    tagsMatchScore: {
      $size: {
        $ifNull: [
          {
            $setIntersection: [
              '$tags',
              tags.map(id => mongoose.Types.ObjectId(id)),
            ],
          },
          [],
        ],
      },
    },
  };
}

function matchDateRange(dateFrom, dateTo, timezone = null) {
  const match = { $and: [] };

  if (dateFrom) {
    const dateFromOr = [
      {
        'dates.from': { $gte: dateFrom },
      },
    ];

    if (timezone) {
      // Ongoing
      dateFromOr.push({
        $and: [
          {
            'dates.from': {
              $gte: moment(dateFrom)
                .tz(timezone || 'utc')
                .set({ hour: 0, minute: 0, second: 0 })
                .toDate(),
            },
          },
          {
            'dates.to': { $gte: dateFrom },
          },
        ],
      });
    }

    match.$and.push({
      $or: dateFromOr,
    });
  }

  if (dateTo) {
    match.$and.push({
      'dates.from': { $lte: dateTo },
    });
  }

  return match;
}

function getNextDateFieldExpr(baseDate) {
  return {
    $let: {
      vars: {
        filteredDatesWithIndex: {
          $arrayElemAt: [
            {
              $filter: {
                input: {
                  $zip: {
                    inputs: ['$dates', { $range: [0, { $size: '$dates' }] }],
                  },
                },
                as: 'zipped',
                cond: {
                  $let: {
                    vars: {
                      date: { $arrayElemAt: ['$$zipped', 0] },
                    },
                    in: {
                      $or: [
                        // Check on both fields because `date.to` may not exist
                        {
                          $gte: ['$$date.from', baseDate],
                        },
                        {
                          $gte: ['$$date.to', baseDate],
                        },
                      ],
                    },
                  },
                },
              },
            },
            0,
          ],
        },
      },
      in: {
        $arrayElemAt: [
          '$dates',
          { $arrayElemAt: ['$$filteredDatesWithIndex', 1] },
        ],
      },
    },
  };
}

module.exports = {
  match,
};
