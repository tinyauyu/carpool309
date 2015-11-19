var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

UserSchema = mongoose.Schema({
	userType: {type:Number, required: true},
	admin: {type:Boolean, required: true},
	email: {type:String, required: true, trim: true},
	passwordHash: {type:String, required: true},
	description: String,
	profilePic: Buffer,
	displayName: String,
});

UserSchema.plugin(autoIncrement.plugin, 'User');

module.exports.UserSchema = UserSchema;