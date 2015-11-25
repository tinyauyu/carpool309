var debug = require('debug')('TripManager.js');
var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

var TripSchema, Trip;

//Get in where the database is mongodb://localhost/
function TripManager(url){
	mongoose.connect(url);
	this.db = mongoose.connection;
	autoIncrement.initialize(this.db);
	this.db.on('error', console.error.bind(console, 'connection error:'));
	this.db.once('open', function (callback) {
		debug("Connected to mongodb");
	});

	TripSchema = require('./TripSchema.js').TripSchema;
	Trip = mongoose.model('Trip',TripSchema);
}

TripManager.prototype.register = function(){
	
}