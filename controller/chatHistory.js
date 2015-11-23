var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Build the chatHistory table
var chatHistory = new Schema({
    message_sender: { type:Number, required: true},
    message_receiver: {type:Number, required: true},
    message_content: {type: String},
    date: { type: Date, default: Date.now}
});

var chatHist = mongoose.model('chatHistory', chatHistory, 'chatHistory');

// make this available to our users in our Node applications
module.exports = chatHist;