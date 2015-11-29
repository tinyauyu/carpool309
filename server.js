var debug = require('debug')('server.js');
var debug_http = require('debug')('http');

debug("Server initializing...");

var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var bodyParser = require('body-parser');
var session = require('client-sessions');
var swig  = require('swig');
var express = require('express');
var app = express();

var ROOT = { root: __dirname+'/public' };

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.use(express.static(__dirname + '/public'));
//app.use(bodyParser.json());
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

var salt = bcrypt.genSaltSync(10);
var secret = bcrypt.hashSync("session_secret", salt);
app.use(session({
  cookieName: 'session',
  secret: secret,
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
  httpOnly:false
}));

var server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  debug('Server is now running at port '+port);
});

app.use(function(req, res, next) {

	debug_http(req.method + ' ' + req.url);

	if(req.url=="/" || req.url=="/api/login/?type=google" ||req.url=="/api/login" || (req.url=="/api/users" && req.method=="POST") || req.url=="/api/logout"){
		next();
		return;
	} else {
		if (req.session && req.session.email) {
		    acManager.getUser(req.session._id, function(success, user) {
			    if (!user) {
		   			res.redirect('/api/logout');
		    		return;
		    	}
		    	// finishing processing the middleware and run the route
		    	next();
		    });
		} else {
			res.redirect('/');
			return;
		}
	}
});

var MONGODB_URL = 'mongodb://localhost/';
//var MONGODB_URL = 'mongodb://carpool309:muchbetterthanuber@ds055564.mongolab.com:55564/heroku_7wrc6q07';

/********************** Managers **********************/
var AccountManager = require('./controller/AccountManager.js');
var acManager = new AccountManager(MONGODB_URL);

var FeedbackManager = require('./controller/FeedbackManager.js');
var feedbackManager = new FeedbackManager(MONGODB_URL);

var MessageManager = require('./controller/MessageManager.js');
var msgManager = new MessageManager(MONGODB_URL, server);

/********************** Managers **********************/

/********************** View *************************/
app.all('/', function(req, res){
	if(req.session._id || req.session._id == 0){
		res.redirect('/users');
	} else {
		res.render('../public/getStarted.html');
	}
});

app.get('/users/:id', function(req, res){
	var page = "/users/" + req.params.id;
	var user = {
		_id: req.session._id
	}

	//acManager.logPage(user,page);

	acManager.getUser(req.session._id,function(success,profile){
		if(!success){
			res.redirect('/users');
			return;
		}
		acManager.getUser(req.params.id, function(success,user){

			if(!success){
				res.redirect('/users');
				return;
			}

			/*
			var pageHistory = {}

			for (i=0; i<user.pageHistory.length; i++){
				var page = user.pageHistory[i];
				if(!pageHistory[page]){
					pageHistory[page] = 1;
				} else {
					pageHistory[page]++;
				}
			}

			var maxView = -1;
			var mostVisitedPage = null;
			for (page in pageHistory){
				console.log(page+" : "+pageHistory[page]);
				if(parseInt(pageHistory[page])>maxView){
					mostVisitedPage = page;
					maxView = pageHistory[page];
				}
			}
			console.log("maxView: "+pageHistory[page]);
			*/
			res.render('profile.html', {
   				profile: profile, user: user, mostVisitedPage: "***disabled***"
			});	

			
		})
	});
});

app.get('/users', function(req, res){
	acManager.getUser(req.session._id,function(success, profile){
		acManager.getUserList(function(users){
			res.render('userList.html', {
   				profile: profile, users: users
			});	
		})
	});
	var user = {
		_id: req.session._id
	}
	var page = "/users";
	//acManager.logPage(user,page);
	
});
/********************** View *************************/

/********************** User Account *************************/
app.delete('/api/users/:id', function(req, res){
	var user_id = req.session._id;
	var profile_id = req.params.id;
	acManager.deleteUser({_id: user_id},{_id: profile_id},function(success, msg){
		if(success){
			feedbackManager.deleteFeedbacksByUser(profile_id,function(success, msg){
				if(success){
					res.send("OK");
				} else {
					res.writeHead(400,msg);
					res.end(msg);
				}
				
			});
		} else {
			res.writeHead(400,msg);
			res.end(msg);
		}
	})
})

app.post('/api/login', function(req, res) {

	if(req.query.type=="google"){
		debug("GOOGLE LOGIN!")
		var profile = JSON.parse(req.body.json);
		acManager.loginGoogle(profile, function(success,user){
			if(success && user){
				debug("User found and login")
				req.session._id = user._id;
				req.session.email = user.email;
				req.session.displayName = user.displayName;
				res.end(JSON.stringify({isLogin: true}));
			} else if(success && !user){
				debug("User NOT found, create user")
				acManager.createUserGoogle(profile, function(success,user){
					if(success && user){
						req.session._id = user._id;
						req.session.email = user.email;
						req.session.displayName = user.displayName;
						res.end(JSON.stringify({isLogin: true}));
					}
				})
			} else {
				res.writeHead(400,user);
				res.end(user);
			}
		})
	} else {
		var profile = JSON.parse(req.body.json);
		acManager.login(profile, function(success,user){
			if(success){
				req.session._id = user._id;
				req.session.email = user.email;
				req.session.displayName = user.displayName;
				res.end("OK");
				debug("Login success!")
			} else {
				res.writeHead(400,user);
				res.end(user);
			}
		})
	}


});

app.get('/api/logout', function(req, res) {
  req.session.reset();
  res.redirect('/');
});

app.post('/api/users', function (req, res){
	var profile = JSON.parse(req.body.json);
	if(req.query.type=="google"){
		debug("Create user by Google");

		acManager.createUserGoogle(profile, function(success,msg){
			if(success){
				res.send('OK');
				return;
			} else {
				res.writeHead(400,msg);
				res.end(msg);
				return;
			}
		})

	} else {
		debug("receiving profile: "+profile.email);

		acManager.createUser(profile, function(success,msg){
			if(success){
				res.send('OK');
				return;
			} else {
				res.writeHead(400,msg);
				res.end(msg);
				return;
			}
		});
	}

});

app.patch('/api/users/:id', function (req, res){
	var profile = JSON.parse(req.body.json);
	profile['_id'] = req.params.id;
	var user = req.session;

	acManager.updateProfile(user, profile, function(success, msg){
		if(success){
			res.send('OK');
			return;
		} else {
			res.writeHead(400,msg);
			res.end(msg);
			return;
		}
	})
});

app.put('/api/changePassword', function (req, res){
	var profile = JSON.parse(req.body.json);
	var user = req.session;

	var loginProfile = {
		email: user.email,
		password: {plain: profile.password.old}
	}
	delete profile.password.old;

	if(user._id!=profile._id){
		res.writeHead(400,"You have no right to change other user's password!");
		res.end("You have no right to change other user's password!");
	}

	if(profile.password.enabled){
		acManager.login(loginProfile, function(success,msg){
			if(!success){
				res.writeHead(400,"Original password invalid");
				res.end("Original password invalid");
			} else {
				acManager.changePassword(profile, function(success, msg){
					if(!success){
						res.writeHead(400,msg);
						res.end(msg);
					} else {
						res.send('OK');
					}
				})
			}
		})
	} else {
		acManager.getUser(profile._id, function(success, p){
			if(!p.password.enabled){
				acManager.changePassword(profile, function(success, msg){
					if(!success){
						res.writeHead(400,msg);
						res.end(msg);
					} else {
						res.send('OK');
					}
				})
			} else {
				res.writeHead(400,"The user has enabled password!")
				res.send('The user has enabled password!')
			}
		})
	}
	

})


app.get('/api/users', function(req, res){
	acManager.getUserList(function(users){
		res.send(users);
	});
});

app.get('/api/users/current', function(req,res){
	acManager.getUser(req.session._id, function(success, user){
		res.send(user);
	});
});


app.get('/api/users/:id', function(req, res){
	acManager.getUser(req.params.id, function(success, user){
		res.send(user);
	});
});

app.get('/api/users/current/profilePic', function(req, res){
	acManager.getUserPic(req.session._id, function(pic){
		res.send(pic);
	})
});

app.get('/api/users/:id/profilePic', function(req, res){
	acManager.getUserPic(req.params.id, function(pic){
		//res.contentType('image/png');
		res.send(pic);
	})
});

/********************** User Account *************************/

/********************** Feedback **********************/
app.post('/api/users/:id/feedbacks', function(req, res){
	var feedback = JSON.parse(req.body.json);
	feedback['sender'] = req.session._id;
	feedback['receiver'] = req.params.id;
	feedbackManager.createFeedback(feedback, function(success,msg){
		if(success){
			res.send(msg);
		} else {
			res.writeHead(400,msg);
			res.end(msg);
		}
	});
});

app.get('/api/users/:id/feedbacks', function(req, res){
	feedbackManager.getFeedbackByUser(req.params.id, function(success,feedbacks){
		if(success){
			res.send(feedbacks);
		} else {
			res.writeHead(400,feedbacks);
			res.end(feedbacks);
		}
	})
});

app.get('/api/feedbacks', function(req, res){
	feedbackManager.getAllFeedback(function(success,feedbacks){
		if(success){
			res.send(JSON.stringify(feedbacks));
		} else {
			res.writeHead(400,feedbacks);
			res.end(feedbacks);
		}
	})
});

app.get('/api/feedbacks/:id', function(req, res){
	feedbackManager.getFeedbackById(req.params.id, function(success,feedbacks){
		if(success){
			res.send(JSON.stringify(feedbacks));
		} else {
			res.writeHead(400,feedbacks);
			res.end(feedbacks);
		}
	})
});

app.delete('/api/feedbacks/:id', function(req, res){
	feedbackManager.deleteFeedbackById(req.params.id, function(success,feedbacks){
		if(success){
			res.send(JSON.stringify(feedbacks));
		} else {
			res.writeHead(400,feedbacks);
			res.end(feedbacks);
		}
	})
});
/********************** Feedback **********************/

/********************** Message **********************/
// app.get('/api/users/chat', function(req, res){
// 	res.sendfile('views/chatWindow.html', {root: __dirname })
// });


app.get('/api/users/:email/chatWindow/', function(req, res){
	var fs = require('fs');
	fs.readFile(__dirname + '/views/chatWindow.html', 'utf8', function(err, data){
		if (err)
			{throw err;}
		else {
			acManager.getUserByEmail(req.params.email, function(success, user){
				if(success){
					var profilePic = user.profilePic;
					console.log(profilePic);
					var chatWindow = {user: user, window: data, profilePic: profilePic};
					res.send(chatWindow);
				} else {
					res.status(404);
					res.end();
				};
			});
		};
	});
});

app.get('/api/unreadmessage/:email/', function(req, res) {
	var email = req.params.email;
	msgManager.getUnreadMsgsForUser(email, function(success, feedbacks) {
		if (success) {
			res.send(JSON.stringify(feedbacks))
		} else {
			res.writeHead(404,feedbacks);
			res.end(feedbacks);
		}
	})
})

app.post('/api/markMsgRead/:sender/:receiver/', function(req, res) {
	var sender = req.params.sender;
	var receiver = req.params.receiver;
	msgManager.markMsgRead(sender, receiver);
	res.end();
})

// app.post('/api/users/:id/messages', function(req, res){
// 	var message = JSON.parse(req.body.json);
// 	message['sender'] = req.session._id;
// 	message['receiver'] = req.params.id;
// 	msgManager.sendMessage(message, function(success,msg){
// 		if(success){
// 			res.send(msg);
// 		} else {
// 			res.writeHead(400,msg);
// 			res.end(msg);
// 		}
// 	});
// });

// app.get('/api/users/:id/messages', function(req, res){
// 	msgManager.getConversation(req.params.id, req.session._id, function(success,msg){
// 		if(success){
// 			res.send(msg);
// 		} else {
// 			res.writeHead(400,msg);
// 			res.end(msg);
// 		}
// 	});
// });
/********************** Message **********************/

app.post('/api/log', function(req, res){
	var b = JSON.parse(req.body.json);

	var behavior = {
		ip_addr : req.connection.remoteAddress,
		browser: b.browser,
		os: b.os,
		mobile: b.mobile,
		screenSize: b.screenSize,
		location: b.location
	}
	
	var user = {
		id: req.session.id,
		behavior: behavior
	}
	acManager.log(user, function(success, msg){
		if(success){
			res.send("OK");
		} else {
			res.writeHead(400,msg);
			res.end(msg);
		}
	})
});

