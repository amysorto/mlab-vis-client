import React, { PureComponent, PropTypes } from 'react';
import Helmet from 'react-helmet';
import classNames from 'classnames';
import { browserHistory } from 'react-router';
import { Row, Col } from 'react-bootstrap';
import { timeAggregations, metrics } from '../../constants';
import * as LocationPageSelectors from '../../redux/locationPage/selectors';
import * as LocationPageActions from '../../redux/locationPage/actions';
import * as LocationsActions from '../../redux/locations/actions';

import { ChartExportControls, LineChart, HourChart } from '../../components';
import UrlHandler from '../../url/UrlHandler';
import urlConnect from '../../url/urlConnect';


// Define how to read/write state to URL query parameters
const urlQueryConfig = {
  viewMetric: { type: 'string', defaultValue: 'download', urlKey: 'metric' },

  // chart options
  showBaselines: { type: 'boolean', defaultValue: false, urlKey: 'baselines' },
  showRegionalValues: { type: 'boolean', defaultValue: false, urlKey: 'regional' },

  // selected time
  startDate: { type: 'date', urlKey: 'start' },
  endDate: { type: 'date', urlKey: 'end' },
  timeAggregation: { type: 'string', defaultValue: 'day', urlKey: 'aggr' },
};
const urlHandler = new UrlHandler(urlQueryConfig, browserHistory);


function mapStateToProps(state, propsWithUrl) {
  return {
    ...propsWithUrl,
    viewMetric: LocationPageSelectors.getViewMetric(state, propsWithUrl),
    hourly: LocationPageSelectors.getActiveLocationHourly(state, propsWithUrl),
    timeSeries: LocationPageSelectors.getActiveLocationTimeSeries(state, propsWithUrl),
    highlightHourly: LocationPageSelectors.getHighlightHourly(state, propsWithUrl),
  };
}

class LocationPage extends PureComponent {
  static propTypes = {
    dispatch: PropTypes.func,
    endDate: PropTypes.object, // date
    highlightHourly: PropTypes.object,
    hourly: PropTypes.object,
    location: PropTypes.object, // route location
    locationId: PropTypes.string,
    showBaselines: PropTypes.bool,
    showRegionalValues: PropTypes.bool,
    startDate: PropTypes.object, // date
    timeAggregation: PropTypes.string,
    timeSeries: PropTypes.object,
    viewMetric: PropTypes.object,
  }

  constructor(props) {
    super(props);

    // bind handlers
    this.handleHighlightHourly = this.handleHighlightHourly.bind(this);
    this.handleShowBaselinesChange = this.handleShowBaselinesChange.bind(this);
    this.handleShowRegionalValuesChange = this.handleShowRegionalValuesChange.bind(this);
  }

  componentDidMount() {
    const { dispatch, locationId, timeAggregation } = this.props;
    dispatch(LocationsActions.fetchTimeSeriesIfNeeded(timeAggregation, locationId));
    dispatch(LocationsActions.fetchHourlyIfNeeded(timeAggregation, locationId));
  }

  componentWillReceiveProps(nextProps) {
    const { dispatch, locationId, timeAggregation } = nextProps;
    dispatch(LocationsActions.fetchTimeSeriesIfNeeded(timeAggregation, locationId));
    dispatch(LocationsActions.fetchHourlyIfNeeded(timeAggregation, locationId));
  }

  /**
   * Helper to get the extent key based on the metric
   *
   * Combines upload and download as 'throughput'
   *
   * @param {Object} viewMetric the metric object for the active view
   * @return {String} the key to read from the extents objects in the data
   */
  getExtentKey(viewMetric) {
    let extentKey = viewMetric.dataKey;
    if (viewMetric.value === 'download' || viewMetric.value === 'upload') {
      extentKey = 'throughput';
    }

    return extentKey;
  }

  /**
   * Callback for show baselines checkbox
   */
  handleShowBaselinesChange(evt) {
    const { dispatch } = this.props;
    const { checked } = evt.target;
    dispatch(LocationPageActions.changeShowBaselines(checked));
  }

  /**
   * Callback for show regional values checkbox
   */
  handleShowRegionalValuesChange(evt) {
    const { dispatch } = this.props;
    const { checked } = evt.target;
    dispatch(LocationPageActions.changeShowRegionalValues(checked));
  }

  /**
   * Callback for time aggregation checkbox
   */
  handleTimeAggregationChange(value) {
    const { dispatch } = this.props;
    dispatch(LocationPageActions.changeTimeAggregation(value));
  }

  /**
   * Callback for when viewMetric changes - updates URL
   */
  handleViewMetricChange(value) {
    const { dispatch } = this.props;
    dispatch(LocationPageActions.changeViewMetric(value));
  }

  /**
   * Callback for when a point is highlighted in hourly
   */
  handleHighlightHourly(d) {
    const { dispatch } = this.props;
    dispatch(LocationPageActions.highlightHourly(d));
  }

  renderCityProviders() {
    return (
      <div>
        <h2>City {this.props.locationId}</h2>
        <Row>
          <Col md={6}>
            {this.renderMetricSelector()}
          </Col>
          <Col md={6}>
            {this.renderTimeAggregationSelector()}
          </Col>
        </Row>
        {this.renderCompareProviders()}
        {this.renderCompareMetrics()}
        {this.renderProvidersByHour()}
      </div>
    );
  }

  renderTimeAggregationSelector() {
    const { timeAggregation } = this.props;

    return (
      <div className="time-aggregation">
        <ul className="list-unstyled">
          {timeAggregations.map(aggr => (
            <li key={aggr.value}>
              <button
                className={classNames('btn btn-default',
                  { active: timeAggregation === aggr.value })}
                onClick={() => this.handleTimeAggregationChange(aggr.value)}
              >
                {aggr.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  renderMetricSelector() {
    const { viewMetric } = this.props;

    return (
      <div className="metric-selector">
        <ul className="list-unstyled">
          {metrics.map(metric => (
            <li key={metric.value}>
              <button
                className={classNames('btn btn-default',
                  { active: viewMetric.value === metric.value })}
                onClick={() => this.handleViewMetricChange(metric.value)}
              >
                {metric.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  renderChartOptions() {
    const { showBaselines, showRegionalValues } = this.props;
    return (
      <div>
        <ul className="list-inline">
          <li>
            <label htmlFor="show-baselines">
              <input
                type="checkbox"
                checked={showBaselines}
                id="show-baselines"
                onChange={this.handleShowBaselinesChange}
              />
              {' Show Baselines'}
            </label>
          </li>
          <li>
            <label htmlFor="show-regional-values">
              <input
                type="checkbox"
                checked={showRegionalValues}
                id="show-regional-values"
                onChange={this.handleShowRegionalValuesChange}
              />
              {' Show Regional Values'}
            </label>
          </li>
        </ul>
      </div>
    );
  }

  renderCompareProviders() {
    const { locationId, timeSeries, viewMetric } = this.props;
    const extentKey = this.getExtentKey(viewMetric);
    const chartId = 'providers-time-series';
    const chartData = timeSeries && timeSeries.results.points;

    return (
      <div>
        <h3>Compare Providers</h3>
        <LineChart
          id={chartId}
          data={chartData}
          height={300}
          width={800}
          yExtent={timeSeries && timeSeries.results.extents.date}
          xKey="date"
          yExtent={timeSeries && timeSeries.results.extents[extentKey]}
          yKey={viewMetric.dataKey}
        />
        <ChartExportControls
          chartId={chartId}
          data={chartData}
          filename={`${locationId}_${viewMetric.value}_${chartId}`}
        />
        {this.renderChartOptions()}
      </div>
    );
  }

  renderCompareMetrics() {
    return (
      <div>
        <h3>Compare Metrics</h3>
      </div>
    );
  }

  renderProvidersByHour() {
    const { hourly, highlightHourly, locationId, viewMetric } = this.props;
    const extentKey = this.getExtentKey(viewMetric);
    const chartId = 'providers-hourly';
    const chartData = hourly && hourly.results.points;

    return (
      <div>
        <h3>By Hour, Median download speeds</h3>
        <HourChart
          data={hourly && hourly.results.points}
          height={300}
          highlightPoint={highlightHourly}
          id={chartId}
          onHighlightPoint={this.handleHighlightHourly}
          width={800}
          yExtent={hourly && hourly.results.extents[extentKey]}
          yKey={viewMetric.dataKey}
        />
        <ChartExportControls
          chartId={chartId}
          data={chartData}
          filename={`${locationId}_${viewMetric.value}_${chartId}`}
        />
      </div>
    );
  }

  renderFixedTimeFrames() {
    return (
      <div>
        <h2>Compare Fixed Time Frame</h2>
        {this.renderFixedCompareMetrics()}
        {this.renderFixedDistributions()}
        {this.renderFixedSummaryData()}
      </div>
    );
  }

  renderFixedCompareMetrics() {
    return (
      <div>
        <h3>Compare Metrics</h3>
      </div>
    );
  }

  renderFixedDistributions() {
    return (
      <div>
        <h3>Distributions of Metrics</h3>
      </div>
    );
  }

  renderFixedSummaryData() {
    return (
      <div>
        <h3>Summary Data</h3>
      </div>
    );
  }

  render() {
    return (
      <div>
        <Helmet title="Location" />
        <h1>Location</h1>
        <div>This is the location page.</div>
        {this.renderCityProviders()}
        {this.renderFixedTimeFrames()}
      </div>
    );
  }
}

export default urlConnect(urlHandler, mapStateToProps)(LocationPage);
