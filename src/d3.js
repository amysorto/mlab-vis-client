/**
 * Our local d3 build. Since webpack has `src` configured as a module
 * directory, we can require the output of this in any file by doing
 *
 * import d3 from 'd3';
 *
 * Then we can use it as we expect: d3.scaleLinear, d3.line, etc.
 */
import * as array from 'd3-array';
import * as transition from 'd3-transition';
import * as scale from 'd3-scale';
import * as selection from 'd3-selection';
import * as shape from 'd3-shape';
import * as timeFormat from 'd3-time-format';
import * as axis from 'd3-axis';
import * as color from 'd3-color';
import * as collection from 'd3-collection';
import * as lineChunked from 'd3-line-chunked';
import * as scaleInteractive from 'd3-scale-interactive';
import * as format from 'd3-format';

export default Object.assign({},
  array,
  scale,
  selection,
  shape,
  timeFormat,
  axis,
  color,
  format,
  lineChunked,
  transition,
  scaleInteractive,
  collection);
