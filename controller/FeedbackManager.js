var debug = require('debug')('FeedbackManager.js');
var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var xss = require('xss');

var FeedbackSchema;

function FeedbackManager(url){
	mongoose.createConnection(url);
	this.db = mongoose.connection;
	this.db.on('error', console.error.bind(console, 'connection error:'));
	this.db.once('open', function (callback) {
		debug("Connected to mongodb");
	});
	autoIncrement.initialize(this.db);

	/*** Initialize Schema ***/
	var FeedbackSchema = require('./FeedbackSchema.js').FeedbackSchema;
	Feedback = mongoose.model('Feedback', FeedbackSchema);
}

FeedbackManager.prototype.createFeedback = function(feedback,callback){
	Feedback.count({}, function(err, count){

		if(count==0){
			Feedback.resetCount(function(err, nextCount){});
		}


		/*** Validation Here ***/
		if(typeof feedback.sender != "number"
			&& typeof feedback.sender != 'string'){
			callback(false, "Feedback must have a sender.");
			return;
		}
		if(typeof feedback.receiver !="string"
			&& typeof feedback.sender != 'number'){
			callback(false, "Feedback must have a receiver.");
			return;
		}

		if(feedback.comment==''
			|| (typeof feedback.rating!="number"
				&& typeof feedback.rating!="string")
			||typeof feedback.comment=="undefined"){
			callback(false, "Feedback must contain either comment or rating.");
			return;
		}
		/***********************/

		feedback.comment = xss(feedback.comment);

		var newFeedback = new Feedback(feedback);

		newFeedback.save(function(error, data){
	    	if(error){
	    		console.log("[ERROR]\t[FeedbackManager.js]\tCannot save feedback to database: " + error);
	        	callback(false,"Internal Server Error");
	        	return;
	    	} else {
	    		debug("Feedback#"+data._id+" created")
	    	    callback(true,data._id.toString());
	    	    return;
	    	}
		});

	});
}

FeedbackManager.prototype.getFeedbackByUser = function(toUserId,callback){
	Feedback.find({receiver:toUserId}).populate('sender receiver').exec(function(err, feedbacks) {
		if(err){
			console.log("[ERROR]\t[FeedbackManager.js]\tCannot get feedbacks from database: " + err);
			callback(false, "Internal Server Error");
			return;
		} else {
			debug("Returning feedbacks:\n"+JSON.stringify(feedbacks));
			callback(true,feedbacks);
			return;
		}
	});
}

FeedbackManager.prototype.getFeedbackById = function(id,callback){
	Feedback.findOne({_id:id}, function(err, feedback) {
		if(err){
			console.log("[ERROR]\t[FeedbackManager.js]\tCannot get feedback from database: " + err);
			callback(false, "Internal Server Error");
			return;
		} else {
			debug("Returning feedback:\n"+JSON.stringify(feedback));
			callback(true,feedback);
			return;
		}
	});
}

FeedbackManager.prototype.deleteFeedbackById = function(feedbackId,callback){
	Feedback.findOneAndRemove({_id:feedbackId}, function(err) {
		if(err){
			console.log("[ERROR]\t[FeedbackManager.js]\tCannot delete feedback from database: " + err);
			callback(false, "Internal Server Error");
			return;
		} else {
			debug("Feedback#"+feedbackId+" deleted");
			callback(true,"feedback#"+feedbackId+" deleted");
			return;
		}
	});
}

FeedbackManager.prototype.deleteFeedbacksByUser = function(userId,callback){
	Feedback.remove({receiver: userId}, function(err) {
		if(err){
			console.log("[ERROR]\t[FeedbackManager.js]\tCannot delete feedback from database: " + err);
			callback(false, "Internal Server Error");
			return;
		} else {
			debug("feedback received by user#"+userId+" deleted");
			callback(true,"feedback received by user#"+userId+" deleted");
			return;
		}
	});
}

FeedbackManager.prototype.getAllFeedback = function(callback){
	Feedback.find({}).populate('sender receiver').exec(function(err, feedbacks) {
		if(err){
			console.log("[ERROR]\t[FeedbackManager.js]\tCannot get feedbacks to database: " + err);
			callback(false, "Internal Server Error");
			return;
		} else {
			debug("Returning all feedbacks:\n"+JSON.stringify(feedbacks));
			callback(true,feedbacks);
			return;
		}
	});
}

module.exports = FeedbackManager;
