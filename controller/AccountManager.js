var debug = require('debug')('AccountManager.js');
var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var path = require('path');
var bcrypt = require('bcrypt');
var https = require('https');

var UserSchema, User;

function AccountManager(url){  //mongodb://localhost/
	mongoose.connect(url);
	this.db = mongoose.connection;
	autoIncrement.initialize(this.db);
	this.db.on('error', console.error.bind(console, 'connection error:'));
	this.db.once('open', function (callback) {
		debug("Connected to mongodb");
	});

	/*** initialize variables ***/
	UserSchema = require('./UserSchema.js').UserSchema;
	User = mongoose.model('User', UserSchema);

}

AccountManager.prototype.login = function(profile, callback){
	debug("Login attempt by " + profile.email);
	User.findOne({ email: profile.email }, function(err, user) {
	    if (!user) {
	    	debug("No such email registered");
	    	callback(false,"Invalid email or password");
	    } else {
	      if(!user.password.enabled){
	      	callback(false,"You haven't set a password! Use Google Login!")
	      	return;
	      }
	      if (bcrypt.compareSync(profile.password.plain, user.password.hash)) {
	      	debug("Login success!")
	        callback(true,user);
	      } else {
	      	debug("Wrong Password");
	        callback(false,"Invalid email or password");
	      }
	    }
	});
}

AccountManager.prototype.loginGoogle = function(profile, callback){

	var options = {
	  host: 'www.googleapis.com',
	  path: '/oauth2/v3/tokeninfo?id_token='+profile.id_token
	};

	https.request(options, function(res){
		console.log(res.statusCode);
		res.setEncoding('utf8');
		res.on('data', function(d) {
			var googleProfile = JSON.parse(d);
			debug("Login in attempt using Google API by: "+googleProfile.email);
			User.findOne({email: googleProfile.email},function(err,user){
				if(err){
					callback(false,"Internal Server Error");
					return;
				} else {
					callback(true,user);
					return;
				}
			})

		});
		//callback(true,"TEST");
	}).end();
}

AccountManager.prototype.getUserList = function(callback){
	User.find({},'_id email displayName', function(err, users){
		if(err) {
			throw err;
		} else {
			callback(users);
		}
	})
}

AccountManager.prototype.getUser = function(id,callback){
	User.findOne({_id: id}, function(err, user){
		if(err) {throw err;}
		if(!user){
			callback(false,null)
		} else {
			callback(true,user);
		}
	})
}

AccountManager.prototype.getUserPic = function(id,callback){
	User.findOne({_id: id},'profilePic', function(err, user){
		if (err) {throw err;}
		if(!user){
			callback(null)
		} else if (typeof user.profilePic == "undefined"){
			callback("/img/default_profilePic.png")
		} else {
			callback(user.profilePic);
		}
	})
}

AccountManager.prototype.createUser = function(profile, callback){
	debug("Creating user ("+profile.email+")");

	User.count({}, function(err, count){

		if(profile.email == ""){
			callback(false,"Please fill in the email address!");
			return;
		}
		if(profile.password.plain == ""){
			callback(false,"Please fill in your password!");
			return;
		}
		if(String(profile.description).length > 500){
			callback(false,"Description must be less than 500 characters!");
			return;
		}

		// handle profilePic
		var profilePic = profile.profilePic
		if(profilePic==null){

		}

		User.find({email: profile.email}, function(err, user){
			if(user[0]){
				callback(false,"Email has been used!");
				return;
			} else {
				var userType = 0;
				if(count==0){
					User.resetCount(function(err, nextCount){});
					userType = 2;
				}

				var salt = bcrypt.genSaltSync(10);
				var passwordHash = bcrypt.hashSync(profile.password.plain, salt);

				var newUser = new User({
					userType: userType,
					email: profile.email,
					password: {hash: passwordHash, enabled: true},
					description: profile.description,
					displayName: profile.displayName,
					profilePic: profilePic,
					admin: false
				});

				newUser.save(function(error, data){
			    	if(error){
			    		console.log("[ERROR]\t[AccountManager.js]\tCannot save user to database: " + error);
			        	callback(false,"Internal Server Error");
			        	return;
			    	} else {
			    		debug("User #"+count+" ("+profile.email+") created");
			    	    callback(true,"OK");
			    	    return;
			    	}
				});
			}
		});
	});
}


AccountManager.prototype.createUserGoogle = function(profile, callback){

	var options = {
	  host: 'www.googleapis.com',
	  path: '/oauth2/v3/tokeninfo?id_token='+profile.id_token
	};

	https.request(options, function(res){
		console.log(res.statusCode);
		res.setEncoding('utf8');
		res.on('data', function(d) {
			debug(d);
			var data = JSON.parse(d)
			var displayName = data.name;
			var email = data.email;
			var profilePic = data.picture;

			debug("email: "+email)
			debug("profilePic: "+profilePic)

			debug("Creating user ("+profile.email+") using Google API");

			User.count({}, function(err, count){

				if(profile.email == ""){
					callback(false,"Please fill in the email address!");
					return;
				}
				
				if(String(profile.description).length > 500){
					callback(false,"Description must be less than 500 characters!");
					return;
				}

				User.find({email: email}, function(err, user){
					if(user[0]){
						callback(false,"Email has been used!");
						return;
					} else {
						var userType = 0;
						if(count==0){
							User.resetCount(function(err, nextCount){});
							userType = 2;
						}

						var newUser = new User({
							userType: userType,
							email: email,
							password: {enabled:false},
							//description: profile.description,
							displayName: displayName,
							profilePic: profilePic,
							admin: false
						});

						newUser.save(function(error, data){
					    	if(error){
					    		console.log("[ERROR]\t[AccountManager.js]\tCannot save user to database: " + error);
					        	callback(false,"Internal Server Error");
					        	return;
					    	} else {
					    		debug("User #"+count+" ("+profile.email+") created");
					    	    callback(true,data);
					    	    return;
					    	}
						});
					}
				});
			});


		});
	}).end();

}

AccountManager.prototype.deleteUser = function(user, profile, callback){
	if(user._id == profile._id){
		callback(false,"You cannot delete your own account!");
		return;
	}
	this.checkAccessRight(user, profile, function(isAuth){
		if(isAuth){
			User.findOneAndRemove({_id: profile._id}, function(err){
				if(err){
					callback(false,err);
				} else {
					callback(true,"OK");
				}
			})
		}
	});
}

AccountManager.prototype.checkAccessRight = function(user, profile, callback){

	var user_type = -1;
	var profile_type = -1;

	if(user._id == profile._id){
		callback(true);
		return;
	}

	User.findOne({_id: user._id}, 'userType', function(err, u){
		user_type = u.userType;
		User.findOne({_id: profile._id}, 'userType', function(err, p){
			profile_type = p.userType;

			if(user_type<1){
				callback(false);
				return;
			} else if(user_type==2){
				callback(true);
				return;
			} else {
				if(profile_type>0){
					callback(false);
					return;
				}
			}

			callback(true);
			return;
		});
	});
}

AccountManager.prototype.updateProfile = function(user, profile, callback){
	// check right to update
	this.checkAccessRight(user, profile, function(isAuth){
		if(!isAuth){
			debug("Invalid access attempt by user#"+user._id);
			callback(false,"You have no right to update this profile!");
			return;
		} else {
			// check field to update
			User.findOneAndUpdate({_id: profile._id}, profile, function(err){
				if(err){
					callback(false,err);
					return;
				} else {
					callback(true,"OK");
					return;
				}
			})
		}

	})
}

AccountManager.prototype.changePassword = function(profile, callback){

	if(profile.password.plain==""){
		callback(false, "New Password cannot be empty!");
		return;
	}

	var salt = bcrypt.genSaltSync(10);
	var passwordHash = bcrypt.hashSync(profile.password.plain, salt);

	var newProfile = profile;
	newProfile.password.hash = passwordHash;
	delete newProfile.password;

	User.findOneAndUpdate({_id: profile._id}, profile, function(err){
		if(err){
			callback(false,err);
			return;
		} else {
			callback(true, "OK");
			return;
		}
	});
}

module.exports = AccountManager;
