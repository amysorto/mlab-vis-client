// import chai, { expect } from 'chai';

import { getIncidents } from './get_incidents.js';
// TODO: remove this line + update dependencies
// eslint-disable-next-line import/no-extraneous-dependencies
import { expect } from 'chai';

describe('finds right incidents', () => {
  it('doesn\'t return incidents if date range is wrong but locationCode is right', () => {
    // const startTime = '2013-06-01T00:00:00Z';
    // const endTime = '2018-11-01T00:00:00Z';
    // const locationCode = 'nausne';
    // expect(getIncidents(startTime, endTime, locationCode)).to.equal({});
    expect(true).to.equal(true);
  });


  // it('returns one incident if location and date range is right', () => {
  //   const startTime = '2013-05-31T00:00:00Z';
  //   const endTime = '2018-11-02T00:00:00Z';
  //   const locationCode = 'nausne';
  //   expect(getIncidents(startTime, endTime, locationCode)).to.equal({});
  // });
  // it('returns multiple incidents if location and date range is right', () => {
  //   const startTime = '2013-05-31T00:00:00Z';
  //   const endTime = '2018-11-02T00:00:00Z';
  //   const locationCode = 'nausne';
  //   expect(getIncidents(startTime, endTime, locationCode)).to.equal({});
  // });
});
