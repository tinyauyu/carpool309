var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

FeedbackSchema = mongoose.Schema({
	sender: {type: Number, ref: 'User'},
	receiver: {type: Number, ref: 'User'},
	comment: String,
	rating: Number,
	date: String
});

FeedbackSchema.plugin(autoIncrement.plugin, 'Feedback');
module.exports.FeedbackSchema = FeedbackSchema;
