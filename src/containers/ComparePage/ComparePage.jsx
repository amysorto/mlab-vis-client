import React, { PureComponent, PropTypes } from 'react';
import Helmet from 'react-helmet';
import moment from 'moment';
import { browserHistory } from 'react-router';
import momentPropTypes from 'react-moment-proptypes';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';

import * as ComparePageSelectors from '../../redux/comparePage/selectors';
import * as ComparePageActions from '../../redux/comparePage/actions';
import * as LocationsActions from '../../redux/locations/actions';
import * as ClientIspsActions from '../../redux/clientIsps/actions';
import * as TransitIspsActions from '../../redux/transitIsps/actions';

// import { colorsFor } from '../../utils/color';
import { facetTypes } from '../../constants';

import {
  ChartExportControls,
  DateRangeSelector,
  LineChartWithCounts,
  MetricSelector,
  SearchSelect,
  SelectableList,
  StatusWrapper,
  TimeAggregationSelector,
} from '../../components';

import UrlHandler from '../../url/UrlHandler';
import urlConnect from '../../url/urlConnect';

import './ComparePage.scss';

// Define how to read/write state to URL query parameters
const urlQueryConfig = {
  viewMetric: { type: 'string', defaultValue: 'download', urlKey: 'metric' },
  facetType: { type: 'string', defaultValue: 'location', urlKey: 'facetBy' },

  // selected time
  // TODO: change defaults to more recent time period when data is up-to-date
  startDate: { type: 'date', urlKey: 'start', defaultValue: moment('2015-10-1') },
  endDate: { type: 'date', urlKey: 'end', defaultValue: moment('2015-11-1') },
  timeAggregation: { type: 'string', defaultValue: 'day', urlKey: 'aggr' },
  facetLocationIds: { type: 'array', urlKey: 'locations' },
  filterClientIspIds: { type: 'array', urlKey: 'filterClientIsps' },
  filterTransitIspIds: { type: 'array', urlKey: 'filterTransitIsps' },
};
const urlHandler = new UrlHandler(urlQueryConfig, browserHistory);

function mapStateToProps(state, propsWithUrl) {
  return {
    ...propsWithUrl,
    facetLocationInfos: ComparePageSelectors.getFacetLocationInfos(state, propsWithUrl),
    facetType: ComparePageSelectors.getFacetType(state, propsWithUrl),
    filterClientIspInfos: ComparePageSelectors.getFilterClientIspInfos(state, propsWithUrl),
    filterTransitIspInfos: ComparePageSelectors.getFilterTransitIspInfos(state, propsWithUrl),
    highlightTimeSeriesDate: ComparePageSelectors.getHighlightTimeSeriesDate(state, propsWithUrl),
    highlightTimeSeriesLine: ComparePageSelectors.getHighlightTimeSeriesLine(state, propsWithUrl),
    overallTimeSeries: ComparePageSelectors.getOverallTimeSeries(state, propsWithUrl),
    overallTimeSeriesStatus: ComparePageSelectors.getOverallTimeSeriesStatus(state, propsWithUrl),
    viewMetric: ComparePageSelectors.getViewMetric(state, propsWithUrl),
  };
}

const pageTitle = 'Compare';
class ComparePage extends PureComponent {
  static propTypes = {
    dispatch: PropTypes.func,
    endDate: momentPropTypes.momentObj,
    facetLocationIds: PropTypes.array,
    facetLocationInfos: PropTypes.array,
    facetType: PropTypes.object,
    filterClientIspIds: PropTypes.array,
    filterClientIspInfos: PropTypes.array,
    filterTransitIspIds: PropTypes.array,
    filterTransitIspInfos: PropTypes.array,
    highlightTimeSeriesDate: PropTypes.object,
    highlightTimeSeriesLine: PropTypes.object,
    overallTimeSeries: PropTypes.array,
    overallTimeSeriesStatus: PropTypes.string,
    startDate: momentPropTypes.momentObj,
    timeAggregation: PropTypes.string,
    viewMetric: PropTypes.object,
  }

  static defaultProps = {
    facetLocationIds: [],
  }

  constructor(props) {
    super(props);

    // bind handlers
    this.onDateRangeChange = this.onDateRangeChange.bind(this);
    this.onFacetTypeChange = this.onFacetTypeChange.bind(this);
    this.onFacetLocationsChange = this.onFacetLocationsChange.bind(this);
    this.onFilterClientIspsChange = this.onFilterClientIspsChange.bind(this);
    this.onFilterTransitIspsChange = this.onFilterTransitIspsChange.bind(this);
    this.onHighlightTimeSeriesDate = this.onHighlightTimeSeriesDate.bind(this);
    this.onHighlightTimeSeriesLine = this.onHighlightTimeSeriesLine.bind(this);
    this.onTimeAggregationChange = this.onTimeAggregationChange.bind(this);
    this.onViewMetricChange = this.onViewMetricChange.bind(this);
  }

  componentDidMount() {
    this.fetchData(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.fetchData(nextProps);
  }

  /**
   * Fetch the data for the page if needed
   */
  fetchData(props) {
    const { dispatch, facetLocationIds, timeAggregation, startDate, endDate } = props;
    const options = { startDate, endDate };

    this.fetchInfo(props);

    // fetch the time series and hourly data for facet locations (unfiltered)
    facetLocationIds.forEach(locationId => {
      dispatch(LocationsActions.fetchTimeSeriesIfNeeded(timeAggregation, locationId, options));
      dispatch(LocationsActions.fetchHourlyIfNeeded(timeAggregation, locationId, options));
    });
  }

  /**
   * Fetch info for the selected ISPs and locations (used in labels)
   */
  fetchInfo(props) {
    const { dispatch, facetLocationIds, filterClientIspIds, filterTransitIspIds } = props;

    // get facet location info if needed
    if (facetLocationIds) {
      facetLocationIds.forEach(facetLocationId => {
        dispatch(LocationsActions.fetchInfoIfNeeded(facetLocationId));
      });
    }

    // get filter client ISP info if needed
    if (filterClientIspIds) {
      filterClientIspIds.forEach(filterClientIspId => {
        dispatch(ClientIspsActions.fetchInfoIfNeeded(filterClientIspId));
      });
    }

    // get filter transit ISP info if needed
    if (filterTransitIspIds) {
      filterTransitIspIds.forEach(filterTransitIspId => {
        dispatch(TransitIspsActions.fetchInfoIfNeeded(filterTransitIspId));
      });
    }
  }

  /**
   * Callback for when facet changes - updates URL
   */
  onFacetTypeChange(value) {
    const { dispatch } = this.props;
    dispatch(ComparePageActions.changeFacetType(value));
  }

  /**
   * Callback for time aggregation checkbox
   */
  onTimeAggregationChange(value) {
    const { dispatch } = this.props;
    dispatch(ComparePageActions.changeTimeAggregation(value));
  }

  /**
   * Callback for when viewMetric changes - updates URL
   */
  onViewMetricChange(value) {
    const { dispatch } = this.props;
    dispatch(ComparePageActions.changeViewMetric(value));
  }

  /**
   * Callback for when start or end date is changed
   * @param {Date} startDate new startDate
   * @param {Date} endDate new endDate
   */
  onDateRangeChange(newStartDate, newEndDate) {
    const { dispatch, startDate, endDate } = this.props;
    if ((!startDate && newStartDate) || (newStartDate && !newStartDate.isSame(startDate, 'day'))) {
      dispatch(ComparePageActions.changeStartDate(newStartDate.toDate()));
    }
    if ((!endDate && newEndDate) || (newEndDate && !newEndDate.isSame(endDate, 'day'))) {
      dispatch(ComparePageActions.changeEndDate(newEndDate.toDate()));
    }
  }

  /**
   * Callback when the facet location list changes
   * @param {Array} facetLocations array of location info objects
   */
  onFacetLocationsChange(facetLocations) {
    const { dispatch } = this.props;
    dispatch(ComparePageActions.changeFacetLocations(facetLocations, dispatch));
  }

  /**
   * Callback when the filter client ISP list changes
   * @param {Array} clientIsps array of client ISP info objects
   */
  onFilterClientIspsChange(clientIsps) {
    const { dispatch } = this.props;
    dispatch(ComparePageActions.changeFilterClientIsps(clientIsps, dispatch));
  }

  /**
   * Callback when the filter transit ISP list changes
   * @param {Array} transitIsps array of transit ISP info objects
   */
  onFilterTransitIspsChange(transitIsps) {
    const { dispatch } = this.props;
    dispatch(ComparePageActions.changeFilterTransitIsps(transitIsps, dispatch));
  }

  /**
   * Callback for when a date is highlighted in time series
   */
  onHighlightTimeSeriesDate(date) {
    const { dispatch } = this.props;
    dispatch(ComparePageActions.highlightTimeSeriesDate(date));
  }

  /**
   * Callback for when a line is highlighted in time series
   */
  onHighlightTimeSeriesLine(series) {
    const { dispatch } = this.props;
    dispatch(ComparePageActions.highlightTimeSeriesLine(series));
  }

  renderTimeRangeSelector() {
    const { startDate, endDate } = this.props;

    return (
      <DateRangeSelector
        startDate={startDate}
        endDate={endDate}
        onChange={this.onDateRangeChange}
      />
    );
  }

  renderFacetSelector() {
    const { facetType } = this.props;

    return (
      <div className="facet-by-selector">
        <h5>Facet By</h5>
        <SelectableList items={facetTypes} active={facetType.value} onChange={this.onFacetTypeChange} />
      </div>
    );
  }

  renderTimeAggregationSelector() {
    const { timeAggregation } = this.props;

    return (
      <TimeAggregationSelector active={timeAggregation} onChange={this.onTimeAggregationChange} />
    );
  }

  renderMetricSelector() {
    const { viewMetric } = this.props;

    return (
      <MetricSelector active={viewMetric.value} onChange={this.onViewMetricChange} />
    );
  }

  renderLocationInputs() {
    const { facetLocationIds, facetLocationInfos, filterClientIspInfos, filterTransitIspInfos } = this.props;
    const hasFacetLocations = facetLocationIds.length;
    return (
      <div className="input-section subsection">
        <div>
          <header>
            <h3>Locations</h3>
          </header>
          <p>Select one or more locations to explore measurements in. Each location will get its own chart.</p>
          <SearchSelect type="location" onChange={this.onFacetLocationsChange} selected={facetLocationInfos} />
        </div>
        <Row>
          <Col md={6}>
            <h4>Filter by Client ISP</h4>
            <p>Select one or more Client ISPs to filter the measurements by.</p>
            <SearchSelect
              type="clientIsp"
              orientation="vertical"
              disabled={!hasFacetLocations}
              onChange={this.onFilterClientIspsChange}
              selected={filterClientIspInfos}
            />
          </Col>
          <Col md={6}>
            <h4>Filter by Transit ISP</h4>
            <p>Select one or more Transit ISPs to filter the measurements by.</p>
            <SearchSelect
              type="transitIsp"
              orientation="vertical"
              disabled={!hasFacetLocations}
              onChange={this.onFilterTransitIspsChange}
              selected={filterTransitIspInfos}
            />
          </Col>
        </Row>
      </div>
    );
  }

  renderInputSection() {
    return (
      <Row>
        <Col md={3}>
          {this.renderFacetSelector()}
        </Col>
        <Col md={9}>
          {this.renderLocationInputs()}
        </Col>
      </Row>
    );
  }

  renderOverall() {
    const { facetType } = this.props;
    return (
      <Row>
        <Col md={3}>
          {this.renderMetricSelector()}
          {this.renderTimeAggregationSelector()}
        </Col>
        <Col md={9}>
          <div className="subsection">
            <header>
              <h3>{`Compare ${facetType.label}s`}</h3>
            </header>
            {this.renderOverallTimeSeries()}
          </div>
        </Col>
      </Row>
    );
  }

  renderOverallTimeSeries() {
    const {
      highlightTimeSeriesDate,
      highlightTimeSeriesLine,
      overallTimeSeries,
      overallTimeSeriesStatus,
      viewMetric,
    } = this.props;
    const chartId = 'overall-time-series';
    if (!overallTimeSeries || !overallTimeSeries.length) {
      return null;
    }
    return (
      <StatusWrapper status={overallTimeSeriesStatus}>
        <LineChartWithCounts
          id={chartId}
          series={overallTimeSeries}
          onHighlightDate={this.onHighlightTimeSeriesDate}
          highlightDate={highlightTimeSeriesDate}
          onHighlightLine={this.onHighlightTimeSeriesLine}
          highlightLine={highlightTimeSeriesLine}
          yFormatter={viewMetric.formatter}
          width={840}
          xKey="date"
          yAxisLabel={viewMetric.label}
          yAxisUnit={viewMetric.unit}
          yKey={viewMetric.dataKey}
        />
        <ChartExportControls
          chartId={chartId}
          data={overallTimeSeries}
          filename={`compare_${viewMetric.value}_${chartId}`}
        />
      </StatusWrapper>
    );
  }

  renderBreakdown() {
    return (
      <Row>
        <Col md={3}>
          <div />
        </Col>
        <Col md={9}>
          <div className="subsection">
            <header>
              <h3>Breakdown</h3>
            </header>
          </div>
        </Col>
      </Row>
    );
  }

  render() {
    return (
      <div className="ComparePage">
        <Helmet title={pageTitle} />
        <div className="section">
          <header>
            <Row>
              <Col md={3}>
                <h2>{pageTitle}</h2>
              </Col>
              <Col md={9}>
                {this.renderTimeRangeSelector()}
              </Col>
            </Row>
          </header>
          {this.renderInputSection()}
          {this.renderOverall()}
          {this.renderBreakdown()}
        </div>
      </div>
    );
  }
}

export default urlConnect(urlHandler, mapStateToProps)(ComparePage);
