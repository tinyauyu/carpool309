//var mongoose = require('mongoose');
console.log("[info]\t[server.js]\tinitializing...");

var ROOT = { root: __dirname+'/public' };

var express = require('express');
var app = express();
var bcrypt = require('bcrypt');
var bodyParser = require('body-parser');
var session = require('client-sessions');
var swig  = require('swig');
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

app.use(function(req, res, next) {

	if(req.url=="/" || req.url=="/api/login" || req.url=="/api/createUser" || req.url=="/api/logout"){
		next();
		return;
	} else {
		if (req.session && req.session.email) {
		    acManager.getUser(req.session.id, function(success, user) {
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

var AccountManager = require('./controller/AccountManager.js');
var acManager = new AccountManager('mongodb://localhost/');

/*** Login Routine ***/


/*** UI ***/
app.all('/', function(req, res){
	if(req.session.id || req.session.id == 0){
		res.redirect('/users');
	} else {
		res.render('../public/getStarted.html');
	}
});

app.get('/users/:id', function(req, res){
	var page = "/users/" + req.params.id;
	var user = {
		id: req.session.id
	}
	acManager.logPage(user,page);

	acManager.getUser(req.session.id,function(success,profile){
		if(!success){
			res.redirect('/users');
			return;
		}
		acManager.getUser(req.params.id, function(success,user){

			if(!success){
				res.redirect('/users');
				return;
			}

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

			res.render('profile.html', {
   				profile: profile, user: user, mostVisitedPage: mostVisitedPage
			});	

			
		})
	});
});

app.get('/users', function(req, res){
	acManager.getUser(req.session.id,function(success, profile){
		acManager.getUserList(function(users){
			res.render('userList.html', {
   				profile: profile, users: users
			});	
		})
	});
	var user = {
		id: req.session.id
	}
	var page = "/users";
	acManager.logPage(user,page);
	
});


/*** API ***/
app.delete('/users/:id', function(req, res){
	var user_id = req.session.id;
	var profile_id = req.params.id;
	acManager.deleteUser({id: user_id},{id: profile_id},function(success, msg){
		if(success){
			res.send("OK");
		} else {
			res.writeHead(400,msg);
			res.end(msg);
		}
	})
})

app.post('/api/login', function(req, res) {
	var profile = JSON.parse(req.body.json);
	console.log("[info]\t[server.js:login]\treceiving profile: " + profile.email);
	acManager.login(profile, function(success,msg){
		if(success){
			req.session.id = msg.id;
			req.session.email = msg.email;
			req.session.displayName = msg.displayName;
			res.end("OK");
		} else {
			res.writeHead(400,msg);
			res.end(msg);
		}
	})
});

app.get('/api/logout', function(req, res) {
  req.session.reset();
  res.redirect('/');
});

app.post('/api/createUser', function (req, res){
	var profile = JSON.parse(req.body.json);
	console.log("[info]\t[server.js]\treceiving profile:" + JSON.stringify(profile));

	// TODO: add user into database!
	acManager.createUser(profile, function(success,msg){
		if(success){
			res.send('OK');
			return;
		} else {
			console.log("[Alert]\t[AccountManager.js]\tCannot create user: "+msg);
			res.writeHead(400,msg);
			res.end(msg);
			return;
		}
	});

});

app.post('/api/updateProfile', function (req, res){
	var profile = JSON.parse(req.body.json);

	var user = req.session;
	console.log("submitted by user#"+user.id);

	acManager.updateProfile(user, profile, function(success, msg){
		if(success){
			res.send('OK');
			return;
		} else {
			console.log("[Alert]\t[AccountManager.js]\tCannot update user profile: "+msg);
			res.writeHead(400,msg);
			res.end(msg);
			return;
		}
	})
});

app.post('/api/changePassword', function (req, res){
	var profile = JSON.parse(req.body.json);
	var user = req.session;

	var loginProfile = {
		email: user.email,
		password: profile.oldPassword
	}
	delete profile.oldPassword;

	if(user.id!=profile.id){
		res.writeHead(400,"You have no right to change other user's password!");
		res.end(msg);
	}

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
})


app.get('/api/userList', function(req, res){
	acManager.getUserList(function(users){
		res.send(users);
	});
});

app.get('/api/user', function(req,res){
	acManager.getUser(req.session.id, function(success, user){
		res.send(user);
	});
});


app.get('/api/user/:id', function(req, res){
	acManager.getUser(req.params.id, function(success, user){
		res.send(user);
	});
});

app.get('/api/profilePic', function(req, res){
	acManager.getUserPic(req.session.id, function(pic){
		res.send(pic);
	})
});

app.get('/api/profilePic/:id', function(req, res){
	acManager.getUserPic(req.params.id, function(pic){
		res.contentType('image/png');
		res.send(pic);
	})
});

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

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('[info]\t[server.js]\tServer is now running port %s', port);
});