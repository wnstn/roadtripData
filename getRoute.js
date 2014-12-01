var Promise = require('es6-promise').Promise,
    googlemaps = require('googlemaps'),
    polyline = require('polyline'),
    geojson = require('geojson'),
    fs = require('fs'),
    util = require('util');

var output = "geojson/temp.json", // name of the output file
    start = "",
    end = "",
    // waypoints is a string with values separated by |
    waypoints = "";

var apiKey = fs.readFile('config-gmaps', function(err, data){
  if (err) {
    util.error(err);
  }
  return data;
});

googlemaps.config({'key': apiKey});

function getGoogleRouteInformation(origin, destination, waypoints) {
  return new Promise(function(resolve, reject){

    if (!origin || !destination) {
      util.error('Origin and destination required!')
    }

    function handleResponse(err, data) {
      if (data.status == "OK") {
        resolve(data);
      } else {
        reject('There was a problem getting the data from Google: ', err);
      }
    };

    googlemaps.directions(origin, destination, handleResponse, false, false, waypoints);
    });
}

function handleError(err) {
  util.error(err);
};

getGoogleRouteInformation(start, end, waypoints)
// Decode the polyline info from Google
.then(function(data){
  var encodedPolyline = data.routes[0].overview_polyline,
      decodedPolyline;

  decodedPolyline = polyline.decode(encodedPolyline.points);

  return decodedPolyline;

}, handleError)
// Convert the array of arrays into an array of objects
.then(function(points){

  var normalized = [];

  points.forEach(function(rawPoints){

    var value = {
      'lat': rawPoints[0],
      'lng': rawPoints[1]
    };

    return normalized.push(value);

  });

  return normalized;

}, handleError)
// Encode the array into proper geoJSON
.then(function(normalizedPoints){

  var geoData = geojson.parse(normalizedPoints, {Point: ['lat', 'lng']});

  return geoData;

}, handleError)
// Write out the file
.then(function(geoData){

  fs.writeFile(output, JSON.stringify(geoData, null, 2));

  util.puts('Successfully created file ' + output)

}, handleError)
.catch(handleError);
