const unidecode = require('unidecode');
const mongoose = require('mongoose');

function match(
  agg,
  {
    textFilter,
    isFbEvent,
    dateFrom,
    venueId,
    country,
    city,
    ids,
    tag,
    exclude,
    tagged,
  }
) {
  const match = {};
  // Text filter must be first in aggregration pipeline
  if (textFilter && textFilter.length >= 2) {
    match.$text = { $search: unidecode(textFilter) };
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
  if (tagged) {
    match['tags.0'] = { $exists: true };
  }
  if (city) {
    match['location.city'] = city;
  }
  if (country) {
    match['location.country'] = country;
  }
  if (venueId) {
    match['organiser.venue'] = mongoose.Types.ObjectId(venueId.toString());
  }
  if (isFbEvent) {
    match['facebook.id'] = { $exists: true };
  }
  agg.match(match);

  agg.addFields({
    nextDate: getNextDateFieldExpr(new Date(dateFrom)),
  });
  if (dateFrom) {
    agg.match({
      nextDate: { $ne: null },
    });
  }

  return agg;
}

function sort(agg, { sortBy, tags }) {
  if (tags) {
    sortByMatchingTags(agg, tags);
  } else if (sortBy) {
    agg.sort(sortBy);
  } else {
    // Order by date by default
    agg.sort({ nextDate: 1 });
  }

  return agg;
}

function sortByMatchingTags(agg, tags) {
  agg.addFields({
    matchScore: {
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
  });
  agg.match({ matchScore: { $gte: 1 } });
  agg.sort({ matchScore: -1 });
  agg.project('-matchScore');
}

function getNextDateFieldExpr(dateFrom) {
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
                          $gte: ['$$date.from', dateFrom],
                        },
                        {
                          $gte: ['$$date.to', dateFrom],
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
  sort,
  match,
};
