var debug = require('debug')('MessageManager.js');
var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

/*** Initialize Schema ***/
var MessageSchema = require('./MessageSchema.js').MessageSchema;
Message = mongoose.model('Message', MessageSchema);

function MessageManager(url, server){
	mongoose.createConnection(url);
	this.db = mongoose.connection;
	this.db.on('error', console.error.bind(console, 'connection error:'));
	this.db.once('open', function (callback) {
		debug("Connected to mongodb");
	});
	this.client = require('socket.io').listen(server).sockets;
	this.client.on('connection', function(socket){
		socket.on('inputMsg', function(data){
			var sender = data.sender;
			var receiver = data.receiver;
			var msg = data.message;
			var newMsg = new Message({
				sender: sender,
				receiver: receiver,
				content: msg
			});
			newMsg.save(function(error, data){
		    	if(error){
		    		res.status(403);
          			res.end("Receiver does not exist");
		        	return;
		    	} else {
		    	    callback(true,"OK");
		    	    return;
		    	}
			});
		});
	});
	autoIncrement.initialize(this.db);


}

MessageManager.prototype.sendMessage = function(message,callback){
	Message.count({}, function(err, count){

		if(count==0){
			Message.resetCount(function(err, nextCount){});
		}

		/*** Validation Here ***/
		if(typeof message.sender=="undefined"){
			callback(false, "Message must have a sender.");
			return;
		}
		if(typeof message.receiver=="undefined"){
			callback(false, "Message must have a receiver.");
			return;
		}
		/***********************/

		var newMessage = new Message(message);

		newMessage.save(function(error, data){
	    	if(error){
	    		console.log("[ERROR]\t[MessageManager.js]\tCannot send message: " + error);
	        	callback(false,"Internal Server Error");
	        	return;
	    	} else {
	    		debug("Message#"+data._id+" created")
	    	    callback(true,data._id.toString());
	    	    return;
	    	}
		});

	});
}

MessageManager.prototype.getConversation = function(user1,user2,callback){
	debug("Get conversation between user#"+user1+" and user#"+user2);
	Message.find({$or:[{sender: user1, receiver:user2},{sender: user2, receiver: user1}]}, function(err, messages) {
		if(err){
			console.log("[ERROR]\t[MessageManager.js]\tCannot get messages from database: " + error);
			callback(false, "Internal Server Error");
			return;
		} else {
			debug("Returning messages:\n"+JSON.stringify(messages));
			callback(true,messages);
			return;
		}
	});
}


module.exports = MessageManager;