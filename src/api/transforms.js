import d3 from '../d3';
import { metrics, ispLabelReplacements } from '../constants';
import { decodeDate } from '../utils/serialization';

// ----------------
// Data Transforms
// ----------------

/* eslint-disable no-param-reassign */

/**
 * Function to help run multiple transformations if `transformed` hasn't already been
 * set on the body.
 *
 * @param {Function} ...transformFuncs Transform functions to call on the body
 * @return {Function} `function (body)`  that runs the transforms on the body
 */
export function transform(...transformFuncs) {
  return function transformApplier(body) {
    if (body.transformed) {
      return body;
    }

    // call each transform func with the output of the previous and return the end result
    // note this assumes each transformFunc modifies body itself
    transformFuncs.reduce((body, transformFunc) => transformFunc(body), body);
    body.transformed = true;

    return body;
  };
}

/**
 * Performs find and replace of strings to clean up ISP labels
 * @param {String} ISP label
 * @return {String} Cleaned ISP label
 */
function cleanIspLabel(label) {
  ispLabelReplacements.forEach((r) => {
    label = label.replace(r.find, r.replace);
  });

  return label;
}

/**
 * Compute the extent for each of the metrics and for the date
 *
 * @param {Array} points the data points to iterate over
 */
function computeDataExtents(points) {
  // make a key array for all the metrics plus date
  const extentKeys = metrics.reduce((keys, metric) => {
    keys.push(metric.dataKey);
    return keys;
  }, ['date']);

  // for each of the keys, generate an extent
  const extents = extentKeys.reduce((extents, key) => {
    extents[key] = d3.extent(points, d => d[key]);
    return extents;
  }, {});

  const downloadKey = metrics.find(d => d.value === 'download').dataKey;
  const uploadKey = metrics.find(d => d.value === 'upload').dataKey;

  // compute the combined throughput extent
  extents.throughput = [
    Math.min(extents[downloadKey][0] || 0, extents[uploadKey][0] || 0),
    Math.max(extents[downloadKey][1] || 0, extents[uploadKey][1] || 0),
  ];

  return extents;
}


/**
 * Transforms the response from time series data before passing it into
 * the application.
 *
 * - Converts date field to js Date object
 * - Adds in the extent for each of the metrics and the date
 *
 * @param {Object} body The response body
 * @return {Object} The transformed response body
 */
export function transformTimeSeries(body) {
  // NOTE: modifying body directly means it modifies what is stored in the API cache
  if (body.results) {
    const points = body.results;
    points.forEach(d => {
      // convert date from string to Date object
      d.date = decodeDate(d.date);
    });

    // add new entries to the body object
    Object.assign(body, {
      results: points,
      extents: computeDataExtents(points),
    });

    if (!body.meta) {
      body.meta = {};
    }
  }

  return body;
}

/**
 * Transforms the response from hourly data before passing it into
 * the application.
 *
 * - Converts date field to js Date object
 * - Converts hour to integers
 * - Adds in the extent for each of the metrics and the date
 *
 * @param {Object} body The response body
 * @return {Object} The transformed response body
 */
export function transformHourly(body) {
  // NOTE: modifying body directly means it modifies what is stored in the API cache
  if (body.results) {
    const points = body.results;

    // convert date from string to Date object and hour to number
    points.forEach(d => {
      d.date = decodeDate(d.date);
      d.hour = parseInt(d.hour, 10);
    });

    // add new entries to the body object
    Object.assign(body, {
      results: points,
      extents: computeDataExtents(points),
    });

    if (!body.meta) {
      body.meta = {};
    }
  }

  return body;
}

function locationLabel(meta) {
  let label = meta.client_city || meta.client_region || meta.client_country || meta.client_continent;

  // Create a display name for locations.
  if (meta.type === 'city') {
    if (meta.client_country === 'United States') {
      label += `, ${meta.client_region}`;
    } else {
      label += `, ${meta.client_country}`;
    }
  } else if (meta.type === 'region') {
    label += `, ${meta.client_country}`;
  }

  return label;
}

/**
 * Transforms location meta to have label
 *
 * - adds in a `label` property to meta
 *
 * @param {Object} body The response body
 * @return {Object} The transformed response body
 */
export function transformLocationLabel(body) {
  // NOTE: modifying body directly means it modifies what is stored in the API cache
  if (body.meta) {
    const { meta } = body;

    meta.shortLabel = meta.client_city || meta.client_region || meta.client_country || meta.client_continent;
    meta.label = locationLabel(meta);
    meta.client_location_label = meta.label;

    // TODO temporarily add in location key if not there and client_location_key is
    if (!meta.location_key && meta.client_location_key) {
      meta.location_key = meta.client_location_key;
    }
  }

  return body;
}

/**
 * Transforms the response from location search before rest of application uses it.
 *
 * @param {Object} body The response body
 * @return {Object} The transformed response body
 */
export function transformLocationSearchResults(body) {
  // NOTE: modifying body directly means it modifies what is stored in the API cache
  if (body.results) {
    const results = body.results;
    results.forEach(d => {
      // Create a display name for cities.
      transformLocationLabel(d);
    });

    // add new entries to the body object
    body.results = results;
  } else {
    body.resuts = [];
  }

  return body;
}

/**
 * Transforms the response from clientIsp search before rest of application uses it.
 *
 * @param {Object} body The response body
 * @return {Object} The transformed response body
 */
export function transformClientIspSearchResults(body) {
  // NOTE: modifying body directly means it modifies what is stored in the API cache
  if (body.results) {
    const results = body.results;
    results.forEach(d => {
      d.meta.label = cleanIspLabel(d.meta.client_asn_name);
    });

    // add new entries to the body object
    body.results = results;
  } else {
    body.resuts = [];
  }

  return body;
}

/**
 * Transforms the response from transitIsp search before rest of application uses it.
 *
 * @param {Object} body The response body
 * @return {Object} The transformed response body
 */
export function transformTransitIspSearchResults(body) {
  // NOTE: modifying body directly means it modifies what is stored in the API cache
  if (body.results) {
    const results = body.results;
    results.forEach(d => {
      d.meta.label = d.meta.server_asn_name;
    });

    // add new entries to the body object
    body.results = results;
  } else {
    body.resuts = [];
  }

  return body;
}


/**
 * Transforms client ISP meta to have label
 *
 * - adds in a `label` property to meta
 *
 * @param {Object} body The response body
 * @return {Object} The transformed response body
 */
export function transformClientIspLabel(body) {
  // NOTE: modifying body directly means it modifies what is stored in the API cache
  if (body.meta) {
    const { meta } = body;

    if (!meta.client_asn_name || !meta.client_asn_name.length) {
      meta.client_asn_name = meta.client_asn_number;
    }
    meta.client_asn_name = cleanIspLabel(meta.client_asn_name);
    meta.label = meta.client_asn_name;
  }

  return body;
}


/**
 * Transforms the response from location info before passing it into
 * the application.
 *
 * - adds in a `label` property to meta
 * - adds in a `id` property to meta
 * - adds in a `parents` array to meta where each is { id, label }
 * - removes meta.parent_location_key
 *
 * @param {Object} body The response body
 * @return {Object} The transformed response body
 */
export function transformLocationInfo(body) {
  // NOTE: modifying body directly means it modifies what is stored in the API cache
  if (body.meta) {
    // add in label
    transformLocationLabel(body);

    const { meta } = body;
    delete meta.parent_location_key;

    let parentFields = ['client_continent', 'client_country', 'client_region'];
    const { type } = meta;

    if (type === 'region') {
      parentFields = parentFields.slice(0, parentFields.length - 1);
    } else if (type === 'country') {
      parentFields = parentFields.slice(0, parentFields.length - 2);
    } else if (type === 'continent') {
      parentFields = [];
    }

    const parents = parentFields.filter(field => meta[field] != null).map(field => ({
      label: meta[field],
      code: meta[`${field}_code`],
    }));

    // build up location key
    let lastCode = '';

    parents.forEach(parent => {
      lastCode += parent.code.toLowerCase();
      parent.id = lastCode;
    });

    meta.parents = parents;
  }

  return body;
}

/**
 * Add a percent bin arrays to a particular fixed section
 * @param {Object} fixedSection Section to add % bins to
 */
function addBinPercents(fixedSection) {
  metrics.forEach((metric) => {
    // only attempt to modify metrics that have bin values
    if (metric.countBinKey && metric.percentBinKey) {
      const bins = fixedSection[metric.countBinKey];

      if (bins) {
        const totalValue = d3.sum(bins);

        const percentBins = bins.map(b => (b / totalValue) * 100.0);
        fixedSection[metric.percentBinKey] = percentBins;
      }
    }
  });
}


/**
 * Transforms the fixed data portion of a response.
 *
 * - converts `last_year_` keys to be grouped under last_year.
 *
 * @param {Object} body The response body
 * @return {Object} The transformed response body
 */
export function transformFixedData(body) {
  // NOTE: modifying body directly means it modifies what is stored in the API cache
  if (body.data) {
    // read in test_counts from meta if available
    if (body.meta) {
      const testCountFields = [
        'last_year_test_count',
        'last_week_test_count',
        'last_month_test_count',
        'last_three_months_test_count',
        'last_six_months_test_count',
      ];
      testCountFields.forEach(field => {
        if (body.meta[field] != null && body.data[field] == null) {
          body.data[field] = body.meta[field];
        }
      });
    }

    const keyMapping = {
      last_year_: 'lastYear',
      last_week_: 'lastWeek',
      last_month_: 'lastMonth',
      last_three_months_: 'lastThreeMonths',
      last_six_months_: 'lastSixMonths',
      other: 'other',
    };

    const mappedKeys = Object.keys(keyMapping);

    // group keys based on the prefix of the key (e.g. last_year_)
    // ends up with { last_year_: ['last_year_download_avg', ...]}
    const keyGroups = d3.nest().key(key => {
      for (let i = 0; i < mappedKeys.length; i++) {
        if (key.indexOf(mappedKeys[i]) === 0) {
          return mappedKeys[i];
        }
      }

      return 'other';
    }).object(Object.keys(body.data));

    // convert to an object
    // e.g. { lastYear: { download_avg: ... }, ... }
    body.data = Object.keys(keyGroups).reduce((groupedData, key) => {
      groupedData[keyMapping[key]] = keyGroups[key].reduce((keyData, dataKey) => {
        const newDataKey = key === 'other' ? dataKey : dataKey.substring(key.length);
        keyData[newDataKey] = body.data[dataKey];
        addBinPercents(keyData);

        return keyData;
      }, {});
      return groupedData;
    }, {});
  }

  return body;
}


/**
 * Transforms the body `results` array to have labels and IDs.
 * Pulls up the meta property to be the main result object.
 *
 * @param {Object} body The response body
 * @return {Object} The transformed response body
 */
export function transformTopClientIsps(body) {
  // NOTE: modifying body directly means it modifies what is stored in the API cache
  if (body.results) {
    body.results = body.results.map(d => {
      const { meta, data } = d;
      meta.client_asn_name = cleanIspLabel(meta.client_asn_name);
      meta.id = meta.client_asn_number;
      meta.label = meta.client_asn_name;

      // ensure we have a test_count value
      if (!meta.test_count) {
        meta.test_count = data.test_count || 0;
      }

      return meta;
    });
  }

  return body;
}


/**
 * Transforms the body `results` array to have labels and IDs.
 * Pulls up the meta property to be the main result object.
 *
 * @param {Object} body The response body
 * @return {Object} The transformed response body
 */
export function transformTopTransitIsps(body) {
  // NOTE: modifying body directly means it modifies what is stored in the API cache
  if (body.results) {
    body.results = body.results.map(d => {
      const { meta, data } = d;
      meta.id = meta.server_asn_number;
      meta.server_asn_name = cleanIspLabel(meta.server_asn_name);
      meta.label = meta.server_asn_name;

      // ensure we have a test_count value
      if (!meta.test_count) {
        meta.test_count = data.test_count || 0;
      }

      return meta;
    });
  }

  return body;
}


/**
 * Transforms the body `results` array to have labels and IDs.
 * Pulls up the meta property to be the main result object.
 *
 * @param {Object} body The response body
 * @return {Object} The transformed response body
 */
export function transformTopLocations(body) {
  // NOTE: modifying body directly means it modifies what is stored in the API cache
  if (body.results) {
    body.results = body.results.map(d => {
      const { meta, data } = d;
      meta.id = meta.location_key;
      meta.label = locationLabel(meta);
      meta.client_location_label = meta.label;

      // ensure we have a test_count value
      if (!meta.test_count) {
        meta.test_count = data.test_count || 0;
      }

      return meta;
    });

    // sort by type. data is already sorted by test count. this gets us cities, then
    // regions, then countries, then continents
    const sortOrderMap = {
      city: 1,
      region: 2,
      country: 3,
      continent: 4,
    };
    const defaultSortValue = 5;

    const nested = d3.nest().key(d => d.type).entries(body.results)
      .sort((a, b) => (sortOrderMap[a.key] || defaultSortValue) - (sortOrderMap[b.key] || defaultSortValue));

    body.results = nested.reduce((reduced, typeEntry) => reduced.concat(typeEntry.values), []);
  }

  return body;
}

/**
 * Transforms transit ISP meta to have label
 *
 * - adds in a `label` property to meta
 *
 * @param {Object} body The response body
 * @return {Object} The transformed response body
 */
export function transformTransitIspLabel(body) {
  // NOTE: modifying body directly means it modifies what is stored in the API cache
  if (body.meta) {
    const { meta } = body;

    if (!meta.server_asn_name || !meta.server_asn_name.length) {
      meta.server_asn_name = meta.server_asn_number;
    }

    meta.server_asn_name = cleanIspLabel(meta.server_asn_name);
    meta.label = meta.server_asn_name;
  }

  return body;
}

/**
 * Transforms the response from client ISP info before passing it into
 * the application.
 *
 * @param {Object} body The response body
 * @return {Object} The transformed response body
 */
export function transformClientIspInfo(body) {
  // NOTE: modifying body directly means it modifies what is stored in the API cache
  if (body.meta) {
    transformClientIspLabel(body);
  }

  return body;
}


/**
 * Transforms the response from transit ISP info before passing it into
 * the application.
 *
 * @param {Object} body The response body
 * @return {Object} The transformed response body
 */
export function transformTransitIspInfo(body) {
  // NOTE: modifying body directly means it modifies what is stored in the API cache
  if (body.meta) {
    transformTransitIspLabel(body);
  }

  return body;
}
