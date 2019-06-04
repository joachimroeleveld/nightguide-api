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
  getNextDateFieldExpr,
};
