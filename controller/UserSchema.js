var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

UserSchema = mongoose.Schema({
	userType: {type:Number, required: true},
	admin: {type:Boolean, required: true},
	email: {type:String, required: true, trim: true},
	password: {enabled: Boolean, hash:String},
	description: String,
	profilePic: Buffer,
	displayName: String,
	lastLocation: {latitude: Number, longitude: Number},
	behavior: {
		browser: String,
		os: String,
		screenSize: String,
		mobile: String,
		location: {
			latitude: Number,
			longitude: Number
		}
	},
	totalRating: Number,
	numberOfRating: Number,
	averageRating: Number,
	fiveStars: Number,
	fourStars: Number,
	threeStars: Number,
	twoStars: Number,
	oneStars: Number
});

UserSchema.plugin(autoIncrement.plugin, 'User');

module.exports.UserSchema = UserSchema;
