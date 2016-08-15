import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import {
  fetchLocationMetricsIfNeeded,
  getLocationMetricsTimeSeriesData,
} from 'redux/modules/location';

import { LineChart } from 'components';

function mapStateToProps(state) {
  return {
    locationMetrics: getLocationMetricsTimeSeriesData(state),
  };
}

class LocationPage extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(fetchLocationMetricsIfNeeded());
  }

  renderCityProviders() {
    return (
      <div>
        <h2>City</h2>
        {this.renderCompareProviders()}
        {this.renderCompareMetrics()}
        {this.renderProvidersByHour()}
      </div>
    );
  }

  renderCompareProviders() {
    const { locationMetrics } = this.props;

    return (
      <div>
        <h3>Compare Providers</h3>
        <LineChart
          width={800}
          height={300}
          data={locationMetrics}
          xKey="date"
          yKey="download_speed_mbps_median"
        />
      </div>
    );
  }

  renderCompareMetrics() {
    return (
      <div>
        <h3>Compare Metrics</h3>
        {this.renderProvidersByHour()}
      </div>
    );
  }

  renderProvidersByHour() {
    return (
      <div>
        <h3>By Hour, Median download speeds</h3>
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

export default connect(mapStateToProps)(LocationPage);
