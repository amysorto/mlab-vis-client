
let moment = require('moment');
const {Storage} = require('@google-cloud/storage');
//requiring path and fs modules


// break the location code into approapriate locations
function getLocationPath(locationCode){
	let locationCodesArr = []

	if (locationCode.length > 6) {
        for (let i = 0; i < 6; i = i+2) {
			locationCodesArr.push(locationCode.slice(i,i+2))
		}

		locationCodesArr.push(locationCode.slice(6))
	}

	for (let i = 0; i < locationCode.length; i = i+2) {
		locationCodesArr.push(locationCode.slice(i,i+2))
    }

    let path = ""

    for (let i = 0; i < locationCodesArr.length; i++){
            path += locationCodesArr[i] 
            path += "/" 
    }
	return path
}


const storage = new Storage({keyFilename: "hmc-mlab-clinic-2019-bb5aabf9d64a.json"});
const bucketName = "incidents-location-hierarchy";


function readStream(stream) {

    return new Promise((resolve, reject) => {
        let data = "";
        
        stream.on("data", chunk => data += chunk);
        stream.on("end", () => resolve(data));
        stream.on("error", error => reject(error));
    });
}


async function getIncidents(startDate, endDate, locationCode){
    let dict= {};

    const [files] = await storage.bucket(bucketName).getFiles({prefix:getLocationPath(locationCode)});
    for (let i = 0; i < files.length; i++){
        let file = files[i];
        let stream = file.createReadStream();
        let incidents = await readStream(stream)
        incidents = JSON.parse(incidents)
        for (let j = 0; j < incidents.length; j++) {
            let incident = incidents[j]
            if (moment(incident["goodPeriodStart"]).isAfter(startDate) && moment(incident["badPeriodEnd"]).isBefore(endDate)){
                let asn = incident["aSN"]
                if (asn in dict){
                    dict[asn] = dict[asn].push(incident)
                }
                else{
                    dict[asn] = [incident]
                }
            }
        }
    }
    
    return dict
}

async function frontEndCall(){
    let D = await getIncidents('2015-04-30T00:00:00Z', '2019-03-05T00:00:00Z','eufr').catch(console.error)
    console.log(D)
}
frontEndCall()

