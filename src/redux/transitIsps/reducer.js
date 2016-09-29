/**
 * Reducer for transitIsps
 */
import { combineReducers } from 'redux';
// import * as Actions from './actions';

import infoWithTypePrefix, { initialState as initialInfoState } from '../shared/infoWithTypePrefix';
import timeWithTypePrefix, { initialState as initialTimeState } from '../shared/timeWithTypePrefix';
import topInfosWithTypePrefix, { initialState as initialTopState } from '../shared/topInfosWithTypePrefix';
import typePrefix from './typePrefix';

const time = timeWithTypePrefix(typePrefix);
const info = infoWithTypePrefix(typePrefix);
const topClientIsps = topInfosWithTypePrefix(typePrefix, 'clientIsps/');
const topLocations = topInfosWithTypePrefix(typePrefix, 'locations/');

export const initialState = {
  id: null,

  info: initialInfoState,
  time: initialTimeState,
  topClientIsps: initialTopState,
  topLocations: initialTopState,
};

// reducer to get the ID
function id(state = initialState.id, action) {
  return action.transitIspId || state;
}

const transitIsp = combineReducers({
  id,
  info,
  time,
  topClientIsps,
  topLocations,
});


// The root reducer
function transitIsps(state = {}, action) {
  if (action.transitIspId != null) {
    const { transitIspId } = action;
    return {
      ...state,
      [transitIspId]: transitIsp(state[transitIspId], action),
    };
  }

  return state;
}


// Export the reducer
export default transitIsps;
