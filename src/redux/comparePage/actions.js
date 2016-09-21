/**
 * Actions for comparePage
 */
import { urlReplaceAction } from '../../url/actions';
import { saveLocationInfoIfNeeded } from '../locations/actions';
import { saveClientIspInfoIfNeeded } from '../clientIsps/actions';
import { saveTransitIspInfoIfNeeded } from '../transitIsps/actions';

/** Actions that replace values in the URL */
export const changeTimeAggregation = urlReplaceAction('timeAggregation');
export const changeViewMetric = urlReplaceAction('viewMetric');
export const changeFacetType = urlReplaceAction('facetType');
export const changeStartDate = urlReplaceAction('startDate');
export const changeEndDate = urlReplaceAction('endDate');

// handle Facet locations
const changeFacetLocationIds = urlReplaceAction('facetLocationIds');
export function changeFacetLocations(newFacetLocations, urlConnectDispatch) {
  return () => {
    // ensure these locations are all saved in the location map
    newFacetLocations.forEach(locationInfo => {
      urlConnectDispatch(saveLocationInfoIfNeeded(locationInfo));
    });

    // update the IDs in the URL
    urlConnectDispatch(changeFacetLocationIds(newFacetLocations.map(d => d.id)));
  };
}

// handle Filter client ISPs
const changeFilterClientIspIds = urlReplaceAction('filterClientIspIds');
export function changeFilterClientIsps(newFilterClientIsps, urlConnectDispatch) {
  return () => {
    // ensure these locations are all saved in the location map
    newFilterClientIsps.forEach(clientIspInfo => {
      urlConnectDispatch(saveClientIspInfoIfNeeded(clientIspInfo));
    });

    // update the IDs in the URL
    urlConnectDispatch(changeFilterClientIspIds(newFilterClientIsps.map(d => d.id)));
  };
}

// handle Filter transit ISPs
const changeFilterTransitIspIds = urlReplaceAction('filterTransitIspIds');
export function changeFilterTransitIsps(newFilterTransitIsps, urlConnectDispatch) {
  return () => {
    // ensure these locations are all saved in the location map
    newFilterTransitIsps.forEach(transitIspInfo => {
      urlConnectDispatch(saveTransitIspInfoIfNeeded(transitIspInfo));
    });

    // update the IDs in the URL
    urlConnectDispatch(changeFilterTransitIspIds(newFilterTransitIsps.map(d => d.id)));
  };
}
