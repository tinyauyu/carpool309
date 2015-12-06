var debug = require('debug')('MessageManager.js');
var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

var cons = {};
var numOnlineUser = 0;

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
        numOnlineUser++;
        socket.on('register', function(data) {
            cons[data.sender] = socket.id;
        });
        //server receives messages from sender
        socket.on('chat message', function(data) {
             var newMsg = new Message({
                 sender: data.sender,
                 receiver: data.receiver,
                 content: data.msg
             });
             //save the received messages to database
             newMsg.save(function(error, data) {
                 if(error) {
                    debug(error);
                    debug("Fail to save message");
                 } else {
                    //server sends message to receiver
                    socket.to(cons[data.receiver]).emit('chat message', data);
                 }
             });
        });
        socket.on('disconnect', function() {
            debug('user disconnected');
            numOnlineUser--;
        });
    });
};

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

MessageManager.prototype.getNumOnlineUsers = function(callback){
    return numOnlineUser;
}


module.exports = MessageManager;