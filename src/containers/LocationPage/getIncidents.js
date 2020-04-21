// require modules
import moment from 'moment';
import { XMLHttpRequest } from "xmlhttprequest";

async function getIncidentWithPromise(responseText, index) {
  const items = responseText.items;
  const request = new XMLHttpRequest();
  return new Promise(function(resolve, reject) {
    request.onreadystatechange = function() {
      if (request.readyState === 4) {
        if (request.status === 200) {
          resolve(JSON.parse(request.responseText));          
        } else {
          reject('Error, status code = ' + request.status);
        }
      }
    }
    request.open('GET', items[index].mediaLink, true);
    request.send();
  });
}


async function getDataWithPromise() {
  const request = new XMLHttpRequest();
  return new Promise(function(resolve, reject) {
    request.onreadystatechange = function() {
      if (request.readyState === 4) {
        if (request.status === 200) {
          resolve(JSON.parse(request.responseText));
        } else {
          reject('Error, status code = ' + request.status);
        }
      }
    }
    request.open('GET', 'https://storage.googleapis.com/storage/v1/b/incidents-location-hierarchy/o', true);
    request.send()
  });
}

/**
 * Takes in a startDate, endDate, and locationCode and returns a dictionary which has
 * asn values as keys and an array of incidents as values.
 * @param {Moment, Moment, string}
 * @return {dictionary}
 */
async function getData(startDate, endDate, locationCode) {
  try {
    const dict = {};
    let count = 0;

    let response = await getDataWithPromise();

    for (let i = 0; i < response.items.length; i++) {
      let incident = await getIncidentWithPromise(response, i);
      count += 1;
      for (let j = 0; j < incident.length; j++) {
        if (
          incident[j].location === locationCode &&
          moment(incident[j].goodPeriodStart).isAfter(startDate) &&
          moment(incident[j].badPeriodEnd).isBefore(endDate)
        ) {
          const asn = incident[j].aSN;
          if (asn in dict) {
            dict[asn] = dict[asn].push(incident[j]);
          } else {
            dict[asn] = [incident[j]];
          }
        }
      }
    }
    // TODO: delete, just for debugging
    console.log(count);
    console.log(dict);
  } catch(error) {
    console.log(error);
  }

}

// TODO: delete, just a sample call
let startDate = '2015-05-01T00:00:00Z';
let endDate = '2018-08-02T00:00:00Z';
let locationCode = 'na';
getData(startDate, endDate, locationCode);

const _getData = getData;
export { _getData as getData };