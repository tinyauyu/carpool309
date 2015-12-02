var debug = require('debug')('MessageManager.js');
var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

var cons = {};

function MessageManager(url, server){
    mongoose.createConnection(url);
    this.db = mongoose.connection;
    this.db.on('error', console.error.bind(console, 'connection error:'));
    this.db.once('open', function (callback) {
        debug("Connected to mongodb");
    });
    autoIncrement.initialize(this.db);
    /*** Initialize Schema ***/
    var MessageSchema = require('./MessageSchema.js').MessageSchema;
    Message = mongoose.model('Message', MessageSchema);
    
    this.client = require('socket.io').listen(server).sockets;
    this.client.on('connection', function(socket) {
        socket.on('register', function(data) {
            cons[data.sender] = socket.id;
        });

        socket.on('chat message', function(data) {
             var newMsg = new Message({
                 sender: data.sender,
                 receiver: data.receiver,
                 content: data.msg
             });
             newMsg.save(function(error, data) {
                 if(error) {
                    debug(error);
                    debug("Fail to save message");
                 } else {
                    socket.to(cons[data.receiver]).emit('chat message', data);
                 }
             });
        });
        socket.on('disconnect', function() {
            debug('user disconnected');
        });
    });
};

// MessageManager.prototype.sendMessage = function(message,callback){
//     Message.count({}, function(err, count){

//         if(count==0){
//             Message.resetCount(function(err, nextCount){});
//         }

//         /*** Validation Here ***/
//         if(typeof message.sender=="undefined"){
//             callback(false, "Message must have a sender.");
//             return;
//         }
//         if(typeof message.receiver=="undefined"){
//             callback(false, "Message must have a receiver.");
//             return;
//         }
//         /***********************/

//         var newMessage = new Message(message);

//         newMessage.save(function(error, data){
//             if(error){
//                 console.log("[ERROR]\t[MessageManager.js]\tCannot send message: " + error);
//                 callback(false,"Internal Server Error");
//                 return;
//             } else {
//                 debug("Message#"+data._id+" created")
//                 callback(true,data._id.toString());
//                 return;
//             }
//         });

//     });
// }

MessageManager.prototype.getConversation = function(user1, user2, callback) {
    Message.find({$or:[{sender: user1, receiver: user2}, {sender: user2, receiver: user1}]}, null, {sort: {date: "ascending"}}, function(err, messages) {
        if(err){
            callback(false, "Internal Server Error");
            return;
        } else {
            callback(true, messages);
            return;
        }
    });
}

MessageManager.prototype.getUnreadMsgsForUser = function(email, callback) {
    Message.find({receiver: email, alreadyRead: false}, function(err, msgs) {
        if (err) {
            console.log("[ERROR]\t[MessageManager.js]\tCannot find unread messages for user with email: " + email)
            callback(false, "Internal Server Error");
            return;
        } else {
            callback(true, msgs);
            return;
        }
    })
}

MessageManager.prototype.markMsgRead = function(sender, receiver) {
    Message.update({sender: sender, receiver: receiver}, {$set: {alreadyRead: true}}, {multi: true}, function(err, docs) {
        return;
    });
}


module.exports = MessageManager;