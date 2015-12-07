/*------------------------------------------------------
Declare global variables
-------------------------------------------------------*/
var debug = require('debug')('server.js');
var debug_http = require('debug')('http');
//Debug option to print
debug("Server initializing...");
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var bodyParser = require('body-parser');
var session = require('client-sessions');
var swig  = require('swig');
var express = require('express');
var app = express();
var compression = require('compression');
var ROOT = { root: __dirname+'/public' };

/*------------------------------------------------------
Declare what does express uses
-------------------------------------------------------*/
app.use(compression());
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
//Performance cache
app.use(express.static(__dirname + '/public',{
	maxAge: 86400000
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

var salt = bcrypt.genSaltSync(10);
var secret = bcrypt.hashSync("session_secret", salt);
app.use(session({
  cookieName: 'session',
  secret: secret,
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
  httpOnly: true
}));

//Ddos security frame work
var Ddos = require('ddos')
var ddos = new Ddos({
	maxcount: 30,
	burst: 8,
	limit: 8 * 30,
	maxexpiry: 120,
	checkinterval : 0.5,
	errormessage : '[DOS Alert] Please wait 120 seconds and try again!',
	testmode: false
});
app.use(ddos.express)

//Server listen on 3000
var server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  debug('Server is now running at port '+port);
});

/*------------------------------------------------------
Bascis login page interface
Login succeed
Login fail
Register
-------------------------------------------------------*/
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

/*------------------------------------------------------
Managers:
3 different functionalities with
3 different controller
3 different mongo db
-------------------------------------------------------*/
var MONGODB_URL = 'mongodb://localhost/';
//var MONGODB_URL = 'mongodb://carpool309:muchbetterthanuber@ds055564.mongolab.com:55564/heroku_7wrc6q07';
var AccountManager = require('./controller/AccountManager.js');
var acManager = new AccountManager(MONGODB_URL);

var FeedbackManager = require('./controller/FeedbackManager.js');
var feedbackManager = new FeedbackManager(MONGODB_URL);

var MessageManager = require('./controller/MessageManager.js');
var msgManager = new MessageManager(MONGODB_URL, server);

var TripManager =  require('./controller/TripManager.js');
var tripManager = new TripManager(MONGODB_URL);


/*------------------------------------------------------
the start page allows to login/register
-------------------------------------------------------*/
app.all('/', function(req, res){
	if(req.session._id || req.session._id == 0){
		res.redirect('/users');
	} else {
		res.render('../public/getStarted.html');
	}
});

/********************** User Account *************************/
/*------------------------------------------------------
if following get request
Get the user id
Then render the correspsongind profile.html
-------------------------------------------------------*/
app.get('/users/:id', function(req, res){
	//var page = "/users/" + req.params.id;
	var user = {
		_id: req.session._id
	}
	var tripId = req.query.trip;
	if (tripId == '' || tripId == null){
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

				//TODO: if exite, if not exits, get the trip object and pass in to render
				res.render('profile.html', {
	   				profile: profile, user: user, mostVisitedPage: "***disabled***"
				});
			})
		});
	}
	else {
		/*------------------------------------------------------
		If there is anouther filed tripId, direct to a 
		different version of profile page
		-------------------------------------------------------*/
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
				//TODO: if exite, if not exits, get the trip object and pass in to render
				tripManager.findOneTrip(tripId, function(success, trip){
					if(!success){
						alert("Faile to find the detail of the trip");
						res.redirect('/users');
						return;
					}
					else {
						tripManager.findOneTrip(req.session.tripId, function(success, userTrip){
							if(!success){
								alert("Faile to find the detail of the trip");
								res.redirect('/users');
								return;
							}
							else {
								res.render('profile.html', {
					   				profile: profile, user: user, mostVisitedPage: "***disabled***", trip: trip, userTrip: userTrip
								});
							}
						});
					}
				});
			});
		});
	}

});

/*------------------------------------------------------
Get all user profiles in the database
And pass into the render function for userList.html
-------------------------------------------------------*/
app.get('/users', function(req, res){
	acManager.getUser(req.session._id,function(success, profile){
		acManager.getUserList(function(users){
			tripManager.findAllTripsByUser(req.session._id,function(success, allTrips){
				res.render('userList.html', {
	   				profile: profile, users: users, allTrips:allTrips
				});
			});
		})
	});
	var user = {
		_id: req.session._id
	}
	var page = "/users";
	//acManager.logPage(user,page);

});

/*------------------------------------------------------
Admin page get request
Get all data from all database and render the html
-------------------------------------------------------*/
app.get('/admin', function(req,res){
	acManager.getUser(req.session._id,function(success, profile){
		if(profile.userType>=1){
			acManager.getUserList(function(users){
				feedbackManager.getAllFeedback(function(success,feedbacks){
					tripManager.findAllTrips(function(success, trips){
						res.render('admin.html', {
			   				allTrips: trips, profile: profile, users: users, feedbacks: feedbacks, numOnlineUsers: msgManager.getNumOnlineUsers()
						});
					})
				})
			})
		} else {
			res.redirect('/users');
		}
	});
});


/*------------------------------------------------------
Delete a speccific user by get the user's id through the request
-------------------------------------------------------*/
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
});

/*------------------------------------------------------
get the login data and check with the databse 
if log in succeed go to certain page
if not, report error message
-------------------------------------------------------*/
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


/*------------------------------------------------------
Logout the user
by reseting the session and redirect to the home page
-------------------------------------------------------*/
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

/*------------------------------------------------------
Get the data from the user
And then update the user profile:
name, email, icons
-------------------------------------------------------*/
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

/*------------------------------------------------------
Get the verified password from user
And update the password in the database
-------------------------------------------------------*/
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
	//Check for different conditions
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
});


/*------------------------------------------------------
GET command which send all users in the database to the client
-------------------------------------------------------*/
app.get('/api/users', function(req, res){
  //console.log('getting user api');
	acManager.getUserList(function(users){
		res.send(users);
	});
});

/*------------------------------------------------------
GET command which return user who satisfy specifis search conditions
-------------------------------------------------------*/
app.get('/api/users/search', function(req, res){
	acManager.searchUser(req.query.keyword, function(success, users){
		if(success){
			res.send(users);
		} else {
			res.writeHead(400,"Internal Server Error");
			res.end("Internal Server Error");
		}
	})
});

/*------------------------------------------------------
Get the current user's data from databse and send to user
-------------------------------------------------------*/
app.get('/api/users/current', function(req,res){
	acManager.getUser(req.session._id, function(success, user){
		res.send(user);
	});
});

/*------------------------------------------------------
GET the user data accroding to user's ID
-------------------------------------------------------*/
app.get('/api/users/:id', function(req, res){
	acManager.getUser(req.params.id, function(success, user){
		res.send(user);
	});
});

/*------------------------------------------------------
Get the profile pic of the current user by knowing keyword current
-------------------------------------------------------*/
app.get('/api/users/current/profilePic', function(req, res){
	acManager.getUserPic(req.session._id, function(pic){
		res.send(pic);
	})
});

/*------------------------------------------------------
GET specific user's icon pic by user's ID
-------------------------------------------------------*/
app.get('/api/users/:id/profilePic', function(req, res){
	acManager.getUserPic(req.params.id, function(pic){
		//res.contentType('image/png');
		res.send(pic);
	})
});

/*------------------------------------------------------
Enable to trace the most visited pages log
-------------------------------------------------------*/
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
		id: req.session._id,
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
/********************** User Account End*************************/


/********************** Feedback **********************/

/*
* create new Feedback api
*/
app.post('/api/users/:id/feedbacks', function(req, res){
	var feedback = JSON.parse(req.body.json);
	feedback['sender'] = req.session._id;
	feedback['receiver'] = req.params.id;
  //update comment for the user
	feedbackManager.createFeedback(feedback, function(success,msg){
		if(success){
      //update rating for the user
      debug("feedback.receiver = "+feedback['receiver'])
      acManager.updateRating(feedback.rating, feedback['receiver'],
				function(success,msg){
    		if(success){
    			res.send(msg);
    		} else {
    			res.writeHead(400,msg);
    			res.end(msg);
    		}
      });
		} else {
			res.writeHead(400,msg);
			res.end(msg);
		}
	});

});

/*
* get feedbacks for a user id api
*/
app.get('/api/users/:id/feedbacks', function(req, res){
	//use data manager to get data and then send
	feedbackManager.getFeedbackByUser(req.params.id,
			function(success,feedbacks){
		if(success){
			res.send(feedbacks);
		} else {
			res.writeHead(400,feedbacks);
			res.end(feedbacks);
		}
	})
});

/*
* get all feedbacks api
*/
app.get('/api/feedbacks', function(req, res){
	//use data manager to get data and then send
	feedbackManager.getAllFeedback(function(success,feedbacks){
		if(success){
			res.send(JSON.stringify(feedbacks));
		} else {
			res.writeHead(400,feedbacks);
			res.end(feedbacks);
		}
	});
});

/*
* get one feedback by it's id api
*/
app.get('/api/feedbacks/:id', function(req, res){
	//use data manager to get data and then send
	feedbackManager.getFeedbackById(req.params.id, function(success,feedback){
		if(success){
			res.send(JSON.stringify(feedback));
		} else {
			res.writeHead(400,feedback);
			res.end(feedback);
		}
	})
});

/*
* delete one feedback by it's id api
*/
app.delete('/api/feedbacks/:id', function(req, res){
	feedbackManager.getFeedbackById(req.params.id, function(success, feedback){
		debug(feedback)
		debug(feedback.rating);
		debug(feedback.receiver);
      //remove rating for the user
      acManager.removeRating(feedback.rating, feedback.receiver, function(success,msg){
    		if(success){
    			feedbackManager.deleteFeedbackById(req.params.id, function(success,feedbacks){
					if(success){
						debug("delete ok")
						res.send(req.params.id.toString());
					} else {
						debug(feedbacks)
						res.writeHead(400,feedbacks);
						res.end(feedbacks);
					}
				})
    		} else {
    			debug(msg);
    			res.writeHead(400,msg);
    			res.end(msg);
    		}
      });
	})
});
/********************** Feedback End**********************/

/********************** Message **********************/
/* get one chatWindow by it's email api */
app.get('/api/users/:email/chatWindow/', function(req, res) {
	var fs = require('fs');
	fs.readFile(__dirname + '/views/chatWindow.html', 'utf8', function(err, data){
		if (err)
			{throw err;}
		else {
			acManager.getUserByEmail(req.params.email, function(success, user){
				if(success){
					var profilePic = user.profilePic;
					//debug(profilePic);
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

/* get one's unreadmessage by it's email api */
app.get('/api/unreadmessage/:email/', function(req, res) {
	var email = req.params.email;
	msgManager.getUnreadMsgsForUser(email, function(success, feedbacks) {
		if (success) {
			res.send(JSON.stringify(feedbacks))
		} else {
			res.writeHead(404,feedbacks);
			res.end(feedbacks);
		}
	});
});

/* mark unread message to read by sender and receiver api */
app.post('/api/markMsgRead/:sender/:receiver/', function(req, res) {
	var sender = req.params.sender;
	var receiver = req.params.receiver;
	msgManager.markMsgRead(sender, receiver);
	res.end();
});

/* get an conversation by user1 and user2 emails api */
app.get('/api/getConversation/:user1/:user2/', function(req, res) {
	var user1 = req.params.user1;
	var user2 = req.params.user2;
	debug(user1);
	debug(user2);
	msgManager.getConversation(user1, user2, function(success, messages) {
		if (success) {
			res.send(JSON.stringify(messages));
		} else {
			res.writeHead(404, messages);
			res.end(messages);
		}
	});
});

/********************** Message End**********************/


/***********************Search&Trip*******************/
/*---------------------------------------------------------
Update trip to Trip db function
update the trip save to the databse
----------------------------------------------------------*/
app.post('/api/updateTrip', function(req,res){
	var trip = req.body;
	trip.user = req.session._id;
	tripManager.updateTrip(trip, function(success,msg){
		if (success){
			res.send(msg);
		}
		else {
			res.writeHead(400,msg);
			res.end(msg);
		}
	});
});

/*-----------------------------------------------------------
GET all trips in the trip database and return to user
------------------------------------------------------------*/
app.get('/api/trips', function(req,res){
	tripManager.findAllTrips(function(success, trips){
		if(success){
			res.send(trips)
		} else {
			res.writeHead(400,trips);
			res.end(trips);
		}
	})
})

/*-----------------------------------------------------------
Delete one specific trip by it's id
------------------------------------------------------------*/
app.delete('/api/trips/:id', function(req,res) {
	tripManager.removeTrip(req.params.id, function(success,msg){
		if(success){
			res.send(msg)
		} else {
			res.writeHead(400,msg);
			res.end(msg);
		}
	})
})

/*-----------------------------------------------------------
GET one trip in the database by giving it's id
------------------------------------------------------------*/
app.get('/searchTrip/:id', function(req,res) {
	var tripId = req.params.id;
	req.session.tripId = tripId;
	tripManager.searchTrip(tripId, function(success,trips){
		if (success){
			tripManager.searchSimilarTrip(tripId, function(success,similarTrips){
				if (success){
					acManager.getUser(req.session._id, function(success, profile){
						res.render('trips.html', {profile: profile, trips: trips, similarTrips: similarTrips});
					})
				}
				else {
					res.writeHead(400,trips);
					res.end(trips);
				}
			});
		}
		else {
			res.writeHead(400,trips);
			res.end(trips);
		}
	});
});
/*-----------------------------------------------------------
Close function
------------------------------------------------------------*/
exports.close = function(){
  server.close();
}
