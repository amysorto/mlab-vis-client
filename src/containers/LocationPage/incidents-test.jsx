// import chai, { expect } from 'chai';

const incident = require('/Users/ruijieschool/Documents/go/src/github.com/m-lab/mlab-vis-client/src/containers/LocationPage/get_incidents');
// eslint-disable-next-line import/no-extraneous-dependencies
const chai = require('chai');

describe('finds right incidents', () => {
  it('doesn\'t return incidents if date range is wrong but locationCode is right', () => {
    const startTime = '2013-06-01T00:00:00Z';
    const endTime = '2018-11-01T00:00:00Z';
    const locationCode = 'nausne';
    chai.expect(incident.getIncidents(startTime, endTime, locationCode)).to.equal({});
  });
  it('returns one incident if location and date range is right', () => {
    const startTime = '2013-05-31T00:00:00Z';
    const endTime = '2018-11-02T00:00:00Z';
    const locationCode = 'nausne';
    chai.expect(incident.getIncidents(startTime, endTime, locationCode)).to.equal({});
  });
  it('returns multiple incidents if location and date range is right', () => {
    const startTime = '2013-05-31T00:00:00Z';
    const endTime = '2018-11-02T00:00:00Z';
    const locationCode = 'nausne';
    chai.expect(incident.getIncidents(startTime, endTime, locationCode)).to.equal({});
  });
});
