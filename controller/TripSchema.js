var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

TripSchema = mongoose.Schema({
	user: {type: Number, ref: 'User'},
	startPoint: {latitude: Number, longitude: Number},
	endPoint:{latitude: Number, longitude: Number}
});

TripSchema.plugin(autoIncrement.plugin, 'Trip');
module.exports.TripSchema = TripSchema;