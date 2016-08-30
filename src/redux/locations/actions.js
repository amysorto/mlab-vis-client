/**
 * Actions for locations
 */
import createFetchAction from '../createFetchAction';

export const FETCH_HOURLY = 'location/FETCH_HOURLY';
export const FETCH_HOURLY_SUCCESS = 'location/FETCH_HOURLY_SUCCESS';
export const FETCH_HOURLY_FAIL = 'location/FETCH_HOURLY_FAIL';
export const FETCH_CLIENT_ISPS = 'location/FETCH_CLIENT_ISPS';
export const FETCH_CLIENT_ISPS_SUCCESS = 'location/FETCH_CLIENT_ISPS_SUCCESS';
export const FETCH_CLIENT_ISPS_FAIL = 'location/FETCH_CLIENT_ISPS_FAIL';
export const FETCH_CLIENT_ISP_TIME_SERIES = 'location/FETCH_CLIENT_ISP_TIME_SERIES';
export const FETCH_CLIENT_ISP_TIME_SERIES_SUCCESS = 'location/FETCH_CLIENT_ISP_TIME_SERIES_SUCCESS';
export const FETCH_CLIENT_ISP_TIME_SERIES_FAIL = 'location/FETCH_CLIENT_ISP_TIME_SERIES_FAIL';
/**
 * Action Creators
 */

// ---------------------
// Fetch Time Series
// ---------------------
const timeSeriesFetch = createFetchAction({
  typePrefix: 'location/',
  key: 'TIME_SERIES',
  args: ['timeAggregation', 'locationId'],
  shouldFetch(state, timeAggregation, locationId) {
    const locationState = state.locations[locationId];
    if (!locationState) {
      return true;
    }

    // if we don't have this time aggregation, we should fetch it
    if (locationState.time.timeSeries.timeAggregation !== timeAggregation) {
      return true;
    }

    // only fetch if it isn't fetching/already fetched
    return !(locationState.time.timeSeries.isFetched || locationState.time.timeSeries.isFetching);
  },
  promise(timeAggregation, locationId) {
    return api => api.getLocationTimeSeries(timeAggregation, locationId);
  },
});
export const FETCH_TIME_SERIES = timeSeriesFetch.types.fetch;
export const FETCH_TIME_SERIES_SUCCESS = timeSeriesFetch.types.success;
export const FETCH_TIME_SERIES_FAIL = timeSeriesFetch.types.fail;
export const shouldFetchTimeSeries = timeSeriesFetch.shouldFetch;
export const fetchTimeSeries = timeSeriesFetch.fetch;
export const fetchTimeSeriesIfNeeded = timeSeriesFetch.fetchIfNeeded;

// ---------------------
// Fetch Hourly
// ---------------------
export function shouldFetchHourly(state, timeAggregation, locationId) {
  const locationState = state.locations[locationId];
  if (!locationState) {
    return true;
  }

  // if we don't have this time aggregation, we should fetch it
  if (locationState.time.hourly.timeAggregation !== timeAggregation) {
    return true;
  }

  // only fetch if it isn't fetching/already fetched
  return !(locationState.time.hourly.isFetched || locationState.time.hourly.isFetching);
}

export function fetchHourly(timeAggregation, locationId) {
  return {
    types: [FETCH_HOURLY, FETCH_HOURLY_SUCCESS, FETCH_HOURLY_FAIL],
    promise: (api) => api.getLocationHourly(timeAggregation, locationId),
    locationId,
    timeAggregation,
  };
}

export function fetchHourlyIfNeeded(timeAggregation, locationId) {
  return (dispatch, getState) => {
    if (shouldFetchHourly(getState(), timeAggregation, locationId)) {
      dispatch(fetchHourly(timeAggregation, locationId));
    }
  };
}


// ---------------------
// Fetch Client ISPs in location
// ---------------------
export function shouldFetchClientIsps(state, locationId) {
  const locationState = state.locations[locationId];
  if (!locationState) {
    return true;
  }

  // only fetch if it isn't fetching/already fetched
  return !(locationState.clientIsps.isFetched || locationState.clientIsps.isFetching);
}

export function fetchClientIsps(locationId) {
  return {
    types: [FETCH_CLIENT_ISPS, FETCH_CLIENT_ISPS_SUCCESS, FETCH_CLIENT_ISPS_FAIL],
    promise: (api) => api.getLocationClientIsps(locationId),
    locationId,
  };
}

export function fetchClientIspsIfNeeded(locationId) {
  return (dispatch, getState) => {
    if (shouldFetchClientIsps(getState(), locationId)) {
      dispatch(fetchClientIsps(locationId));
    }
  };
}


// ---------------------
// Fetch Client ISP in Location Time Series
// ---------------------
export function shouldFetchClientIspLocationTimeSeries(state, timeAggregation, locationId, clientIspId) {
  const locationState = state.locations[locationId];
  if (!locationState) {
    return true;
  }

  const clientIspTimeState = locationState.time.clientIsps[clientIspId];
  if (!clientIspTimeState) {
    return true;
  }

  // if we don't have this time aggregation, we should fetch it
  if (clientIspTimeState.timeSeries.timeAggregation !== timeAggregation) {
    return true;
  }

  // only fetch if it isn't fetching/already fetched
  return !(clientIspTimeState.timeSeries.isFetched ||
    clientIspTimeState.timeSeries.isFetching);
}

export function fetchClientIspLocationTimeSeries(timeAggregation, locationId, clientIspId) {
  return {
    types: [FETCH_CLIENT_ISP_TIME_SERIES, FETCH_CLIENT_ISP_TIME_SERIES_SUCCESS,
      FETCH_CLIENT_ISP_TIME_SERIES_FAIL],
    promise: (api) => api.getLocationClientIspTimeSeries(timeAggregation, locationId, clientIspId),
    clientIspId,
    locationId,
    timeAggregation,
  };
}

export function fetchClientIspLocationTimeSeriesIfNeeded(timeAggregation, locationId, clientIspId) {
  return (dispatch, getState) => {
    if (shouldFetchClientIspLocationTimeSeries(getState(), timeAggregation, locationId, clientIspId)) {
      dispatch(fetchClientIspLocationTimeSeries(timeAggregation, locationId, clientIspId));
    }
  };
}




// ---------------------
// Fetch Location Info
// ---------------------
const infoFetch = createFetchAction({
  typePrefix: 'location/',
  key: 'INFO',
  args: ['locationId'],
  shouldFetch(state, locationId) {
    const locationState = state.locations[locationId];
    if (!locationState) {
      return true;
    }

    return !(locationState.info.isFetched || locationState.info.isFetching);
  },
  promise(locationId) {
    return api => api.getLocationInfo(locationId);
  },
});
export const FETCH_INFO = infoFetch.types.fetch;
export const FETCH_INFO_SUCCESS = infoFetch.types.success;
export const FETCH_INFO_FAIL = infoFetch.types.fail;
export const shouldFetchInfo = infoFetch.shouldFetch;
export const fetchInfo = infoFetch.fetch;
export const fetchInfoIfNeeded = infoFetch.fetchIfNeeded;

