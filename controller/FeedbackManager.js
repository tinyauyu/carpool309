var debug = require('debug')('FeedbackManager.js');
var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var xssFilters = require('xss-filters');

var FeedbackSchema;

/*
* constructor that create the FeedbackManager that control the
* database
* params: the url and port that the database manager listens to
*/
function FeedbackManager(url){
	//connect to the database
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

/*
* create a new feedback by passing in a new feedback object
* the new feedback object contain sender, reciever, comment,
* and rating
*/
FeedbackManager.prototype.createFeedback = function(feedback,callback){
	Feedback.count({}, function(err, count){

		if(count==0){
			Feedback.resetCount(function(err, nextCount){});
		}


		/*** Validation Here ***/
		//the sender must be either in string or number format
		if(typeof feedback.sender != "number"
			&& typeof feedback.sender != 'string'){
			callback(false, "Feedback must have a sender.");
			return;
		}
		//the reciever must be either in string or number format
		if(typeof feedback.receiver !="string"
			&& typeof feedback.sender != 'number'){
			callback(false, "Feedback must have a receiver.");
			return;
		}
		//the comment must be either in string format
		//the comment cannot be empty
		//the rating must be number or string format
		if(feedback.comment==''
			|| (typeof feedback.rating!="number"
				&& typeof feedback.rating!="string")
			||typeof feedback.comment=="undefined"){
			callback(false, "Feedback must contain either comment or rating.");
			return;
		}
		/****validation end*********/

		feedback.comment = xssFilters.inHTMLData(feedback.comment);

		//create a new feedback object that fit in the schema
		var newFeedback = new Feedback(feedback);

		//save this to the database
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

/*
* get all of the comments for a user id
* params: the user id that recieves the comments and a callback function
*/
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

/*
*	get one feedback given it's id
*/
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

/*
* delete a feedback given it's feedbackId
*/
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

/*
* delete all of the feedbacks of a user
* params: the user id, and a call back function
*/
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

/*
* get all of the feedbacks in the database
* params: the callback funciton
*/
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

//export the module as a library
module.exports = FeedbackManager;
