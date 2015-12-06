var debug = require('debug')('TripManager.js');
var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

var TripSchema, Trip;

//Get in where the database is mongodb://localhost/
function TripManager(url){
	mongoose.createConnection(url);
	this.db = mongoose.connection;
	autoIncrement.initialize(this.db);
	this.db.on('error', console.error.bind(console, 'connection error:'));
	this.db.once('open', function (callback) {
		debug("Connected to mongodb");
	});

	TripSchema = require('./TripSchema.js').TripSchema;
	Trip = mongoose.model('Trip',TripSchema);
}

TripManager.prototype.updateTrip = function(trip,callback){
	var newTrip = new Trip(trip);
	newTrip.save(function(error,data){
		if (error){
    		console.log("[ERROR]\t[TripManager.js]\tCannot save trip to database: " + error);
        	callback(false,"Internal Server Error");
        	return;
		}
		else {
			callback(true, data._id.toString());
			return;
		}
	});
}

TripManager.prototype.removeTrip = function(tripId, callback){
	Trip.findOneAndRemove({_id: tripId}, function(err) {
		if(err){
			console.log("[ERROR]\t[TripManager.js]\tCannot delete trip from database: " + err);
			callback(false, "Internal Server Error");
			return;
		} else {
			debug("Trip#"+tripId+" deleted");
			callback(true,"trip#"+tripId+" deleted");
			return;
		}
	});
}

TripManager.prototype.searchTrip = function(tripId,callback){
	var currentTime = new Date();
	var sortedTrips = [];
	Trip.findOne({_id:tripId}, function (err,newTrip){
		if (err){
    		console.log("[ERROR]\t[TripManager.js]\tCannot find trip in database: " + error);
        	callback(false,"Internal Server Error");
        	return;
		}
		else { //FindOne
			Trip.find({}, function (err,allTrips){
				if (err){
					throw err;
				}
				else { //Find all
					var validTrips = [];
					for (var i in allTrips) {
						if (new Date(allTrips[i].date) < currentTime){
							//Delete all those trips that required date has been in the past
							//console.log(allTrips[i]._id);
							Trip.findOneAndRemove({_id: allTrips[i]._id}, function (err){
									if(err){
										throw err;
									}
							});
						}
						else{
							//var distance = findDistance(newTrip,allTrips[i]);
							//No need to consider those trips with price higher than the max price expected bu wanted user
							//If max price is not inputted, then select everyone regardless of the price
							if (!newTrip.provider){
								var priceBoolean = (allTrips[i].price < newTrip.price || newTrip.price == '' || newTrip.price == null);
							}//If the user is a provider, then no need to consider those price which are lower than their expected price
							else {
								var priceBoolean = (allTrips[i].price > newTrip.price || newTrip.price == '' || newTrip.price == null);
							}
							//User can not search for the trip that he provided/wanted themselves
							var notThemselves = (allTrips[i].user != newTrip.user);
							//If the user select provider, then only those who are trips wanted user will be searched
							//Verse-versa, if the user select trips wanted, only the providers will be matched
							var userType = ((newTrip.provider && !allTrips[i].provider) || (!newTrip.provider && allTrips[i].provider));
							//If all above conditions satisfied, then this trip is valid/meaningful to search and return to the user
							if (priceBoolean && notThemselves && userType){
								validTrips.push(allTrips[i]);
							}
						}
					}
					//After we get a list of valid trips, we will search for trips that are near to user's From and To places
					sortedTrips = getDistanceAndSort(newTrip, validTrips);
					//console.log(sortedTrips);
					callback(true,sortedTrips);
					return;
				}
			});
		}
	});
}

TripManager.prototype.searchSimilarTrip = function(tripId,callback){
	var currentTime = new Date();
	var sortedTrips = [];
	Trip.findOne({_id:tripId}, function (err,newTrip){
		if (err){
    		console.log("[ERROR]\t[TripManager.js]\tCannot find trip in database: " + error);
        	callback(false,"Internal Server Error");
        	return;
		}
		else { //FindOne
			Trip.find({}).populate('user').exec(function (err,allTrips){
				if (err){
					throw err;
				}
				else { //Find all
					var validTrips = [];
					for (var i in allTrips) {
						if (new Date(allTrips[i].date) < currentTime){
							//Delete all those trips that required date has been in the past
							//console.log(allTrips[i]._id);
							Trip.findOneAndRemove({_id: allTrips[i]._id}, function (err){
									if(err){
										throw err;
									}
							});
						}
						else{
							//User can not search for the trip that he provided/wanted themselves
							var notThemselves = (allTrips[i].user._id != newTrip.user);
							//If the user select provider, then only those who are trips wanted user will be searched
							//Verse-versa, if the user select trips wanted, only the providers will be matched
							var userType = ((newTrip.provider && allTrips[i].provider) || (!newTrip.provider && !allTrips[i].provider));
							//If all above conditions satisfied, then this trip is valid/meaningful to search and return to the user
							if (notThemselves && userType){
								validTrips.push(allTrips[i]);
							}
						}
					}
					//After we get a list of valid trips, we will search for trips that are near to user's From and To places
					sortedTrips = getDistanceAndSort(newTrip, validTrips);
					//console.log(sortedTrips);
					callback(true,sortedTrips);
					return;
				}
			});
		}
	});
}

TripManager.prototype.findOneTrip = function (tripId, callback){
	Trip.findOne({_id: tripId}, function (err, trip){
		if (err){
    		console.log("[ERROR]\t[TripManager.js]\tCannot find trip in database: " + error);
        	callback(false,"Internal Server Error");
        	return;
		}
		else {
			callback(true,trip);
			return;
		}
	});
}

TripManager.prototype.findAllTripsByUser = function (userId, callback){
	Trip.find({user: userId}, function (err, trip){
		if (err){
    		console.log("[ERROR]\t[TripManager.js]\tCannot find trip in database: " + error);
        	callback(false,"Internal Server Error");
        	return;
		}
		else {
			callback(true,trip);
			return;
		}
	});
}

TripManager.prototype.findAllTrips = function (callback){
	Trip.find({}).populate('user').exec(function (err, trip){
		if (err){
    		console.log("[ERROR]\t[TripManager.js]\tCannot find trip in database: " + error);
        	callback(false,"Internal Server Error");
        	return;
		}
		else {
			debug(trip);
			callback(true,trip);
			return;
		}
	});
}

function findDistance(trip1, trip2){
	var lat1 = trip1.startPoint.latitude * Math.PI / 180;
	var lat2 = trip2.startPoint.latitude * Math.PI / 180;
	var lon1 = trip1.startPoint.longitude * Math.PI / 180;
	var lon2 = trip2.startPoint.longitude * Math.PI / 180;
	var d = findOneDistance(lat1,lat2,lon1,lon2);
	lat1 = trip1.endPoint.latitude * Math.PI / 180;
	lat2 = trip2.endPoint.latitude * Math.PI / 180;
	lon1 = trip1.endPoint.longitude * Math.PI / 180;
	lon2 = trip2.endPoint.longitude * Math.PI / 180;
	d = d + findOneDistance(lat1,lat2,lon1,lon2);
	return d;
}

function findOneDistance(lat1,lat2,lon1,lon2){
	var R = 6371000; // metres
	var φ1 = lat1;
	var φ2 = lat2;
	var Δφ = lat2-lat1;
	var Δλ = lon2-lon1;
	var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
	        Math.cos(φ1) * Math.cos(φ2) *
	        Math.sin(Δλ/2) * Math.sin(Δλ/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	var d = R * c;
	return d;
}

function getDistanceAndSort(newTrip, validTrips){
	var sortedTrips = [];
	for (var i in validTrips){
		var d = findDistance(newTrip,validTrips[i]);
		var smallestDistance = 50000;
		if (d < smallestDistance){
			var temple = JSON.stringify(validTrips[i]);
			temple = JSON.parse(temple);
			temple['distance'] = d;
			sortedTrips.push(temple);
		}
	}
	//Sort the array by the distance element in the json object
	sortedTrips.sort(function(a, b) {
    	return a.distance - b.distance;
	});
	return sortedTrips;
}

module.exports = TripManager;
module.exports.findOneDistance = findOneDistance;
module.exports.findDistance = findDistance;
