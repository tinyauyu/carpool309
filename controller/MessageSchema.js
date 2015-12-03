var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

MessageSchema = mongoose.Schema({
	sender: {type: String, ref: 'User.email'},
	receiver: {type: String, ref: 'User.email'},
	content: String,
	date: {type: Date, default: Date.now, expires: 604800},
    alreadyRead: {type: Boolean, default: false}
});

MessageSchema.plugin(autoIncrement.plugin, 'Message');
module.exports.MessageSchema = MessageSchema;