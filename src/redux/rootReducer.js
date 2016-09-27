import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import { reducer as clientIsps } from './clientIsps';
import { reducer as comparePage } from './comparePage';
import { reducer as transitIsps } from './transitIsps';
import { reducer as locations } from './locations';
import { reducer as locationClientIsp } from './locationClientIsp';
import { reducer as locationTransitIsp } from './locationTransitIsp';
import { reducer as clientIspTransitIsp } from './clientIspTransitIsp';
import { reducer as locationClientIspTransitIsp } from './locationClientIspTransitIsp';
import { reducer as locationPage } from './locationPage';
import { reducer as globalSearch } from './globalSearch';

export default combineReducers({
  clientIsps,
  clientIspTransitIsp,
  comparePage,
  globalSearch,
  locationPage,
  locations,
  locationClientIsp,
  locationClientIspTransitIsp,
  locationTransitIsp,
  routing: routerReducer,
  transitIsps,
});
