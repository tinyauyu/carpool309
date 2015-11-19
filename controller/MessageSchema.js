var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

MessageSchema = mongoose.Schema({
	sender: {type: Number, ref: 'User'},
	receiver: {type: Number, ref: 'User'},
	content: String,
	date: {type: Date, default: Date.now}
});

MessageSchema.plugin(autoIncrement.plugin, 'Message');
module.exports.MessageSchema = MessageSchema;