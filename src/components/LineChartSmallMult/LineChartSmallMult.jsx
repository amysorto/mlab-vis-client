import React, { PureComponent, PropTypes } from 'react';
import d3 from 'd3';
import { multiExtent } from '../../utils/array';

import './LineChartSmallMult.scss';

/**
 * A small multiple chart that uses d3 to draw. Assumes X is a time scale.
 *
 * @prop {Boolean} forceZeroMin=true Whether the min y value should always be 0.
 * @prop {Number} chartHeight The height in pixels an individual chart
 * @prop {String} id The ID of the SVG chart (needed for PNG export)
 * @prop {Boolean} inSvg Whether this is being nested inside an SVG, if true renders a <g>
 * @prop {Array} series The array of series data (e.g., [{ meta, results }, ...])
 * @prop {Boolean} showBaseline=true Whether the first element in series is a baseline value
 * @prop {Number} width The width in pixels of the entire small multiple
 * @prop {Array} xExtent The min and max value of the xKey in the chart
 * @prop {String} xKey="x" The key to read the x value from in the data
 * @prop {String} yKeys="y" The keys to read the y value from in the data
 */
export default class LineChartSmallMult extends PureComponent {

  static propTypes = {
    chartHeight: PropTypes.number,
    forceZeroMin: PropTypes.bool,
    id: PropTypes.string,
    series: PropTypes.array,
    showBaseline: PropTypes.bool,
    width: React.PropTypes.number,
    xExtent: PropTypes.array,
    xKey: PropTypes.string,
    yKeys: PropTypes.array,
    yLabels: PropTypes.array,
  }

  static defaultProps = {
    chartHeight: 110,
    forceZeroMin: true,
    showBaseline: true,
    xKey: 'date',
    yKeys: [],
    yLabels: [],
  }

  /**
   * Initiailize the vis components when the component is about to mount
   */
  componentWillMount() {
    this.visComponents = this.makeVisComponents(this.props);
  }

  /**
   * When the react component mounts, setup the d3 vis
   */
  componentDidMount() {
    this.setup();
  }

  /**
   * When new props are received, regenerate vis components if necessary
   */
  componentWillReceiveProps(nextProps) {
    // regenerate the vis components if the relevant props change
    this.visComponents = this.makeVisComponents(nextProps);
  }

  /**
   * When the react component updates, update the d3 vis
   */
  componentDidUpdate() {
    this.update();
  }

  /**
   * Initialize the d3 chart - this is run once on mount
   */
  setup() {
    // Holds refs to chart nodes for line updating.
    this.chartNodes = {};

    this.update();
  }

  /**
   * Figure out what is needed to render the chart
   * based on the props of the component
   */
  makeVisComponents(props) {
    const { series,
            forceZeroMin,
            showBaseline,
            width,
            xExtent,
            xKey,
            yKeys,
            yLabels,
            chartHeight,
            innerMarginLeft = 50,
            innerMarginRight = 20,
            innerMarginTop = 40,
            chartPadding = 30,
          } = props;

    let { annotationSeries, xScale } = props;

    const innerMargin = {
      top: innerMarginTop,
      right: innerMarginRight,
      bottom: 35,
      left: innerMarginLeft,
    };

    const innerWidth = width - innerMargin.left - innerMargin.right;

    const chartWidth = (innerWidth / yKeys.length) - chartPadding;


    let height = innerMargin.top + innerMargin.bottom;
    if (series && series.length > 0) {
      height += (series.length * (chartHeight + chartPadding));
    }

    const xMin = 0;
    const xMax = chartWidth;
    const yMin = chartHeight;
    const yMax = 0;

    // set up the domains based on extent. Use the prop if provided, otherwise calculate
    let xDomain = xExtent;
    if (!xDomain && series) {
      xDomain = multiExtent(series, d => d[xKey], oneSeries => oneSeries.results);
    }


    // setup the y scales for all our yKeys
    let yScales = [];
    if (yKeys && series && series.length > 0) {
      yScales = yKeys.map((yKey) => {
        const yExtent = multiExtent(series, d => d[yKey], oneSeries => oneSeries.results);
        if (yExtent && forceZeroMin) {
          yExtent[0] = 0;
        }
        return d3.scaleLinear()
          .domain(yExtent)
          .range([yMin, yMax]);
      });
    }

    // use the props xScale if provided, otherwise compute it
    if (!xScale) {
      xScale = d3.scaleTime().range([xMin, xMax]);
      if (xDomain) {
        xScale.domain(xDomain);
      }
    }

    // initialize a color scale
    // TODO: this should be moved out and shared among components.
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    if (series) {
      color.domain(series.map(s => s.meta.client_asn_number));
    }

    // create lineChunked generators for all ykeys
    let lineGens = [];
    if (yScales && yScales.length > 0) {
      lineGens = yScales.map((yScale, yIndex) =>
        // function to generate paths for each yKey
        d3.lineChunked()
          .x((d) => xScale(d[xKey]))
          .y((d) => yScale(d[yKeys[yIndex]]))
          .curve(d3.curveLinear)
          .defined(d => d[yKeys[yIndex]] != null)
          .accessData(d => d.results)
          .lineStyles({
            stroke: (d, i) => {
              // first element is baseline value
              return (showBaseline && i === 0) ? '#aaa' : color(d.meta.client_asn_number);
            },
            'stroke-width': 1.5,
          })
      );
    }

    // ensure annotation series is an array
    if (annotationSeries && !Array.isArray(annotationSeries)) {
      annotationSeries = [annotationSeries];
    }

    return {
      // annotationLineChunked,
      annotationSeries,
      color,
      height,
      innerHeight,
      innerMargin,
      innerWidth,
      chartWidth,
      chartHeight,
      chartPadding,
      lineGens,
      showBaseline,
      series,
      width,
      xScale,
      xKey,
      yScales,
      yKeys,
      yLabels,
    };
  }

  /**
   * Update the d3 chart - this is the main drawing function
   */
  update() {
    this.updateCharts();
  }

  /**
   * Iterates through data, using line generators to update charts.
   */
  updateCharts() {
    const { series, lineGens, yKeys, showBaseline } = this.visComponents;

    series.forEach((s, sIndex) => {
      yKeys.forEach((yKey, keyIndex) => {
        // TODO: change to just .id once data consistently has id and name value
        const seriesId = (showBaseline && sIndex === 0) ? s.meta.client_city : s.meta.client_asn_number;
        const chartId = `${seriesId}-${yKey}`;

        // get appropriate chart node
        const chart = d3.select(this.chartNodes[chartId]);

        const data = [s];
        if (showBaseline && sIndex > 0) {
          data.unshift(series[0]);
        }


        // BIND
        const binding = chart.selectAll('g').data(data);

        // ENTER
        const entering = binding.enter().append('g');

        // MERGE
        binding.merge(entering)
          .transition()
          .call(lineGens[keyIndex]);

        // EXIT
        binding.exit().remove();
      });
    });
  }

  /**
   * React style building of chart
   */
  renderChart(series, seriesIndex, yKey, index) {
    const { chartWidth, chartPadding, showBaseline } = this.visComponents;
    // TODO: change to just .id once data consistently has id and name value
    const seriesId = (showBaseline && seriesIndex === 0) ? series.meta.client_city : series.meta.client_asn_number;
    const chartId = `${seriesId}-${yKey}`;
    const xPos = (chartWidth + chartPadding) * index;

    return (
      <g
        id={chartId}
        key={chartId}
        ref={node => { this.chartNodes[chartId] = node; }}
        transform={`translate(${xPos},${0})`}
      />
    );
  }

  /**
   * React style building of row of data
   */
  renderSeries(series, seriesIndex) {
    const { yKeys, chartHeight, chartPadding, showBaseline } = this.visComponents;

    const yPos = (chartHeight + chartPadding) * seriesIndex;
    // position text below charts for now
    const yPosText = chartHeight + chartPadding;
    // TODO: change to just .id once data consistently has id and name value
    const seriesKey = (showBaseline && seriesIndex === 0) ? series.meta.client_city : series.meta.client_asn_number;
    const seriesName = (showBaseline && seriesIndex === 0) ? series.meta.client_city : series.meta.client_asn_name;

    return (
      <g
        key={seriesKey}
        className="small-mult-row"
        transform={`translate(${0},${yPos})`}
      >
        <text
          className="small-mult-label small-mult-name"
          y={yPosText}
          dy={-4}
        >
          {seriesName}
        </text>
        {yKeys.map((k, i) => this.renderChart(series, seriesIndex, k, i))}
      </g>
    );
  }

  /**
   * React style label creation
   */
  renderLabels() {
    const { chartWidth, chartPadding, yLabels, innerMargin } = this.visComponents;
    const labels = yLabels.map((key, index) => {
      const xPos = (chartWidth / 2) + ((chartWidth + chartPadding) * index);
      return (
        <text
          key={key}
          className="small-mult-label"
          x={xPos}
          y={chartPadding}
          textAnchor="middle"
        >{key}</text>

      );
    });

    return (
      <g transform={`translate(${innerMargin.left},${0})`}>
        {labels}
      </g>
    );
  }

  /**
   * React style rect creation for background
   */
  renderBackground(width, height) {
    return (
      <rect
        width={width}
        height={height}
        x={0}
        y={0}
        fill="white"
      />
    );
  }

  /**
   * The main render method. Defers chart rendering to d3 in `update` and `setup`
   * @return {React.Component} The rendered container
   */
  render() {
    const { id, series } = this.props;

    const { innerMargin, width, height } = this.visComponents;

    return (
      <div className="LineChartSmallMult">
        <svg
          id={id}
          className="small-mult-svg chart"
          height={height}
          ref={node => { this.root = node; }}
          width={width}
        >
          {this.renderBackground(width, height)}
          {this.renderLabels()}
          <g
            transform={`translate(${innerMargin.left},${innerMargin.top})`}
          >
            {series.map((s, i) => this.renderSeries(s, i))}
          </g>
        </svg>
      </div>
    );
  }
}
