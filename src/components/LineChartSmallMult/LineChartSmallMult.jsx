import React, { PureComponent, PropTypes } from 'react';
import d3 from 'd3';
import { multiExtent, findClosestSorted } from '../../utils/array';
import { colorsFor } from '../../utils/color';
import { TextWithBackground } from '../../components';

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
 * @prop {Array} metrics="y" The keys and names to read the y value from in the data
 */
export default class LineChartSmallMult extends PureComponent {

  static propTypes = {
    chartHeight: PropTypes.number,
    forceZeroMin: PropTypes.bool,
    id: PropTypes.string,
    metrics: PropTypes.array,
    series: PropTypes.array,
    showBaseline: PropTypes.bool,
    width: React.PropTypes.number,
    xExtent: PropTypes.array,
    xKey: PropTypes.string,
  }

  static defaultProps = {
    chartHeight: 110,
    forceZeroMin: true,
    showBaseline: true,
    xKey: 'date',
    metrics: [],
  }

  constructor(props) {
    super(props);

    this.state = {
      hover: false,
      mouse: [0, 0],
    };

    this.onMouseOver = this.onMouseOver.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
  }

  /**
   * Initiailize the vis components when the component is about to mount
   */
  componentWillMount() {
    // Holds refs to chart nodes for line updating.
    this.chartNodes = {};

    // holds refs to backgrounds of charts so we can do
    // mouseover with d3.mouse
    this.backgroundNodes = {};

    this.visComponents = this.makeVisComponents(this.props);
  }

  /**
   * When the react component mounts, setup the d3 vis
   */
  componentDidMount() {
    this.setup();
  }

  /**
   * When new component is updating, regenerate vis components if necessary
   */
  componentWillUpdate(nextProps) {
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
   * Mouse over callback
   */
  onMouseOver() {
    this.setState({ hover: true });
  }

  /**
   * Mouse out callback
   */
  onMouseOut() {
    this.setState({ hover: false });
  }

  /**
   * Mouse move callback. gets mouse position relative to chart and
   * save it in state.
   * @param {Array} mouse Mouse [x,y] position relative to chart
   */
  onMouseMove(mouse) {
    this.setState({ mouse });
  }

  /**
   * Initialize the d3 chart - this is run once on mount
   */
  setup() {
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
            metrics,
            chartHeight,
            timeAggregation,
            innerMarginLeft = 3, // leave enough room for circle radius
            innerMarginRight = 20,
            innerMarginTop = 40,
            chartPadding = 30,
          } = props;

    let { xScale } = props;

    const innerMargin = {
      top: innerMarginTop,
      right: innerMarginRight,
      bottom: 35,
      left: innerMarginLeft,
    };

    const innerWidth = width - innerMargin.left - innerMargin.right;

    const chartWidth = (innerWidth / metrics.length) - chartPadding;


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


    // setup the y scales for all our metrics
    let yScales = [];
    if (metrics && series && series.length > 0) {
      yScales = metrics.map((metric) => {
        const yExtent = multiExtent(series, d => d[metric.dataKey], oneSeries => oneSeries.results);
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
      xScale = d3.scaleTime().range([xMin, xMax]).clamp(true);
      if (xDomain) {
        xScale.domain(xDomain);
      }
    }

    // get colors
    let colors = {};
    if (series) {
      colors = colorsFor(series, (d) => d.meta.client_asn_number);
    }

    // create lineChunked generators for all ykeys
    let lineGens = [];
    if (yScales && yScales.length > 0) {
      lineGens = yScales.map((yScale, yIndex) =>
        // function to generate paths for each yKey
        d3.lineChunked()
          .x((d) => xScale(d[xKey]))
          .y((d) => yScale(d[metrics[yIndex].dataKey]))
          .curve(d3.curveMonotoneX)
          .defined(d => d[metrics[yIndex].dataKey] != null)
          .accessData(d => d.results)
          .lineStyles({
            // first element is baseline value
            stroke: (d, i) => ((showBaseline && i === 0) ? '#bbb' : colors[d.meta.client_asn_number]),
            'stroke-width': (d, i) => ((showBaseline && i === 0) ? 1 : 1.5),
          })
      );
    }

    return {
      colors,
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
      metrics,
      timeAggregation,
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
    const { series, lineGens, metrics, showBaseline, chartHeight, xScale } = this.visComponents;

    series.forEach((s, sIndex) => {
      metrics.forEach((metric, keyIndex) => {
        // TODO: change to just .id once data consistently has id and name value
        const seriesId = (showBaseline && sIndex === 0) ? s.meta.client_city : s.meta.client_asn_number;
        const chartId = `${seriesId}-${metric.dataKey}`;

        // get appropriate chart node
        const chart = d3.select(this.chartNodes[chartId]);

        const data = [s];
        if (showBaseline && sIndex > 0) {
          data.unshift(series[0]);
        }

        // add in axis line
        let axisLine = chart.select('.axis-line');
        if (axisLine.empty()) {
          axisLine = chart.append('line').attr('class', 'axis-line');
        }
        axisLine
          .attr('x1', xScale.range()[0])
          .attr('x2', xScale.range()[1])
          .attr('y1', chartHeight + 3)
          .attr('y2', chartHeight + 3);

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

        // handle mouse over
        const that = this;
        d3.select(this.backgroundNodes[chartId])
          .on('mousemove', function mouseMoveListener() {
            that.onMouseMove(d3.mouse(this));
          })
          .on('mouseover', this.onMouseOver)
          .on('mouseout', this.onMouseOut);
      });
    });
  }

  /**
   * React style building of chart
   */
  renderChart(series, seriesIndex, yKey, metricIndex) {
    const { chartWidth, chartPadding, showBaseline } = this.visComponents;
    // TODO: change to just .id once data consistently has id and name value
    const seriesId = (showBaseline && seriesIndex === 0) ? series.meta.client_city : series.meta.client_asn_number;
    const chartId = `${seriesId}-${yKey}`;
    const xPos = (chartWidth + chartPadding) * metricIndex;

    return (
      <g key={chartId} transform={`translate(${xPos},${0})`} >
        <g
          id={chartId}
          ref={node => { this.chartNodes[chartId] = node; }}
        />
      { this.renderChartLabels(series, chartId, seriesIndex, yKey, metricIndex) }
      { this.renderChartBackground(chartId) }
      </g>
    );
  }

  /**
   * React style addition of labels on mouseover
   */
  renderChartLabels(series, chartId, seriesIndex, yKey, metricIndex) {
    const { hover, mouse } = this.state;
    const { xScale, yScales, colors, xKey, showBaseline, metrics } = this.visComponents;

    // find the value closest to the mouse's x coordinate
    const closest = findClosestSorted(series.results, mouse[0], d => xScale(d[xKey]));
    const xValue = closest[xKey];
    const yValue = closest[yKey];

    const color = ((showBaseline && seriesIndex === 0) ? '#bbb' : colors[series.meta.client_asn_number]);
    const lightColor = d3.color(color).brighter(0.3);
    const yFormatter = metrics[metricIndex].formatter || (d => d);

    if (hover && yValue) {
      return (
        <g transform={`translate(${xScale(xValue)} ${yScales[metricIndex](yValue)})`}>
          <TextWithBackground
            x={0}
            y={0}
            dy={3}
            dx={6}
            textAnchor="start"
            textClassName="small-mult-label small-mult-hover-label"
            background="#fff"
            padding={{ top: 3, bottom: 3, left: 3, right: 3 }}
          >
            {yFormatter(yValue)}
          </TextWithBackground>
          <circle cx={0} cy={0} r={3} fill={lightColor} stroke={color} />
        </g>
      );
    }

    return null;
  }

  /**
   * React style addition of mouseover box
   */
  renderChartBackground(chartId) {
    const { chartWidth, chartHeight, chartPadding } = this.visComponents;
    return (
      <rect
        className="small-mult-chart-background"
        key={chartId}
        ref={node => { this.backgroundNodes[chartId] = node; }}
        x={0}
        y={0}
        width={chartWidth + chartPadding}
        height={chartHeight}
        fill="none"
        pointerEvents="all"
      />
    );
  }

  /**
   * React style building of row of data
   */
  renderSeries(series, seriesIndex) {
    const { metrics, chartHeight, chartPadding, showBaseline } = this.visComponents;

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
          dy={-14}
        >
          {seriesName}
        </text>
        {metrics.map((metric, i) => this.renderChart(series, seriesIndex, metric.dataKey, i))}
      </g>
    );
  }

  /**
   * React style label creation
   */
  renderLabels() {
    const { chartWidth, chartPadding, metrics, innerMargin } = this.visComponents;
    const labels = metrics.map((metric, index) => {
      const xPos = ((chartWidth + chartPadding) * index);
      return (
        <text
          key={metric.dataKey}
          className="small-mult-title"
          x={xPos}
          y={chartPadding}
          textAnchor="start"
        >{metric.label}</text>

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
