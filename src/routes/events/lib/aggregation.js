const unidecode = require('unidecode');
const mongoose = require('mongoose');

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
  const match = {};

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
    match['date.artists'] = {
      $in: artist.map(id => mongoose.Types.ObjectId(id)),
    };
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
    Object.assign(match, matchDateRange(dateFrom, dateTo));
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

function matchDateRange(dateFrom, dateTo) {
  const match = { $and: [] };
  if (dateFrom) {
    match.$and.push({
      // Check on both fields because `date.to` may not exist
      $or: [
        {
          'dates.from': { $gte: dateFrom },
        },
      ],
    });
  }
  if (dateTo) {
    match.$and.push({
      'dates.from': { $lte: dateTo },
    });
  }
  return match;
}

module.exports = {
  match,
};
