const moment = require('moment');

const { Storage } = require('@google-cloud/storage');

/**
 * Takes location code and inserts / where needed for file path
 * @param {string}
 * @return {string}
 */
function getLocationPath(locationCode) {
  const locationCodesArr = [];

  if (locationCode.length > 6) {
    for (let i = 0; i < 6; i += 2) {
      locationCodesArr.push(locationCode.slice(i, i + 2));
    }

    locationCodesArr.push(locationCode.slice(6));
  }

  for (let i = 0; i < locationCode.length; i += 2) {
    locationCodesArr.push(locationCode.slice(i, i + 2));
  }

  let path = '';

  for (let i = 0; i < locationCodesArr.length; i++) {
    path += locationCodesArr[i];
    path += '/';
  }
  return path;
}


const storage = new Storage({ keyFilename: 'hmc-mlab-clinic-2019-e7987b0ad1cb.json' });
const bucketName = 'incidents-location-hierarchy';

// code from Human who Codes:
// https://humanwhocodes.com/snippets/2019/05/nodejs-read-stream-promise/
function readStream(stream) {
  return new Promise((resolve, reject) => {
    let data = '';

    stream.on('data', chunk => data += chunk);
    stream.on('end', () => resolve(data));
    stream.on('error', error => reject(error));
  });
}

/**
 * Takes in a startDate, endDate, and locationCode and returns a dictionary which has
 * asn values as keys and an array of incidents as values.
 * @param {Moment, Moment, string}
 * @return {dictionary}
 */
async function getIncidents(startDate, endDate, locationCode) {
  const dict = {};

  const [files] = await storage.bucket(bucketName).getFiles({ prefix: getLocationPath(locationCode) });
  console.log(getLocationPath(locationCode));
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const stream = file.createReadStream();
    let incidents = await readStream(stream);
    incidents = JSON.parse(incidents);
    for (let j = 0; j < incidents.length; j++) {
      const incident = incidents[j];
      if (moment(incident.goodPeriodStart).isAfter(startDate) && moment(incident.badPeriodEnd).isBefore(endDate)) {
        const asn = incident.aSN;
        if (asn in dict) {
          dict[asn] = dict[asn].push(incident);
        } else {
          dict[asn] = [incident];
        }
      }
    }
  }

  return dict;
}

// example front end call to API
async function frontEndCall() {
  const D = await getIncidents('2013-04-30T00:00:00Z', '2019-03-05T00:00:00Z', 'nausca').catch(console.error);
  console.log(D);
}
frontEndCall();

