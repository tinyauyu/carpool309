var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

TripSchema = mongoose.Schema({
	user: {type: Number, ref: 'User'},
	startPoint: {
		text: String,
		latitude: Number,
		longitude: Number
	},
	endPoint:{
		text: String,
		latitude: Number,
		longitude: Number
	},
	date: String,
	price: Number,
	provider: Boolean,
	searchDistance: Number,
});

TripSchema.plugin(autoIncrement.plugin, 'Trip');
module.exports.TripSchema = TripSchema;