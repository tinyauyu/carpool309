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
});
/*** Things to add: ***
1. rating



 *********************/

UserSchema.plugin(autoIncrement.plugin, 'User');

module.exports.UserSchema = UserSchema;