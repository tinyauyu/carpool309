var debug = require('debug')('AccountManager.js');
var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var path = require('path');
var bcrypt = require('bcrypt');
var https = require('https');
var xssFilters = require('xss-filters');

var UserSchema, User;

/*
* constructor that create the Manager that control the
* database
* params: the url and port that the database manager listens to
*/
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
	User.collection.ensureIndex({email: 'text', description: 'text', displayName: 'text'}, function(error) {});

}

/*
* check the validation of user login information
*/
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

/*
* provide google login method for user
*/
AccountManager.prototype.loginGoogle = function(profile, callback){

	var options = {
	  host: 'www.googleapis.com',
	  path: '/oauth2/v3/tokeninfo?id_token='+profile.id_token
	};

	https.request(options, function(res){
		//console.log(res.statusCode);
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

/*
* get all of the user list
*/
AccountManager.prototype.getUserList = function(callback){
	User.find({},'_id email displayName', function(err, users){
		if(err) {
			throw err;
		} else {
			callback(users);
		}
	})
}

/*
* get the user from user's email
*/
AccountManager.prototype.getUserByEmail = function(email, callback){
	debug("Get user by email: "+email);
	User.findOne({email: email}, function(err, user){
		if(err) {throw err;}
		if(!user){
			callback(false,null)
		} else {
			callback(true,user);
		}
	})
}

/*
* get the user's picture from user's id
* also check the validation of user
*/
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

/*
* create a new user and store into the database
* params: profile object that include email, password, description, etc
* and a callback function
*/
AccountManager.prototype.createUser = function(profile, callback){
	debug("Creating user ("+profile.email+")");

	User.count({}, function(err, count){
		/*validation check*/
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
		if(typeof profilePic === "undefined"){
			profilePic = "/img/default_profilePic.png";
		}

		// xss-filter
		profile = filterUserProfile(profile);

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
				//construct a User object that fit into the schema
				var newUser = new User({
					userType: userType,
					email: profile.email,
					password: {hash: passwordHash, enabled: true},
					description: profile.description,
					displayName: profile.displayName,
					profilePic: profilePic,
					admin: false,
					totalRating: 0,
					numberOfRating: 0,
					averageRating: 0,
					fiveStars: 0,
					fourStars: 0,
					threeStars: 0,
					twoStars: 0,
					oneStars: 0
				});

				//save into database
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

/*
*	if user use google login, then we need to initialize it and store into
* the database, also need the profile object and callback function
*/
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

			// handle no profilePic
			if(typeof profilePic === "undefined"){
				profilePic = "/img/default_profilePic.png";
			}

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

						//initialize the profile to save in database
						var newProfile = {
							userType: userType,
							email: email,
							password: {enabled:false},
							//description: profile.description,
							displayName: displayName,
							profilePic: profilePic,
							admin: false,
							totalRating: 0,
							numberOfRating: 0,
							averageRating: 0,
							fiveStars: 0,
							fourStars: 0,
							threeStars: 0,
							twoStars: 0,
							oneStars: 0
						}

						// xss-filter
						newProfile = filterUserProfile(newProfile);
						var newUser = new User(newProfile);

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

			profile = filterUserProfile(profile);

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



AccountManager.prototype.getUser = function(id,callback){
	debug("Get profile of user#"+id);
	User.findOne({_id: id}, function(err, user){
		if(err) {throw err;}
		if(!user){
			callback(false, null)
		} else {
			callback(true, user);
		}
	})
}

AccountManager.prototype.updateRating =  function(rating, receiver, callback){
	var conditions = { _id: receiver }, options = {}, update ={};
	this.getUser(receiver, function(success, user){
		if(!success){
			callback(false, 'Error finding user');
		}
		else{
			rating = parseInt(rating);
			user.totalRating += rating;
			//console.log("updating total rating: "+ user.totalRating);
			user.numberOfRating += 1;
			switch(rating) {
				case 1:
					user.oneStars+=1;
					break;
				case 2:
					user.twoStars+=1;
					break;
				case 3:
					user.threeStars+=1;
					break;
				case 4:
					user.fourStars+=1;
					break;
				case 5:
					user.fiveStars+=1;
					break;
				default:
					break;
			}
			user.averageRating = user.totalRating / user.numberOfRating;
			debug("user total rating: "+ user.totalRating);
			debug("user num of rating: "+user.numberOfRating)
			debug("user average rating: "+ user.averageRating);
			User.findOneAndUpdate(conditions, user, options, function(err){
				if(err){
					callback(false,err);
					return;
				} else {
					callback(true,"OK");
					return;
				}
			});
		}
	});
}

AccountManager.prototype.removeRating =  function(rating, receiver, callback){
	var conditions = { _id: receiver }, options = {}, update ={};
	debug("removing rating for user#" + receiver);
	this.getUser(receiver, function(success, user){
		if(!success){
			callback(false, user);
		} else {
			rating = parseInt(rating);
			user.totalRating -= rating;
			//console.log("updating total rating: "+ user.totalRating);
			user.numberOfRating -= 1;
			switch(rating) {
				case 1:
					user.oneStars-=1;
					break;
				case 2:
					user.twoStars-=1;
					break;
				case 3:
					user.threeStars-=1;
					break;
				case 4:
					user.fourStars-=1;
					break;
				case 5:
					user.fiveStars-=1;
					break;
				default:
					break;
			}
			if(user.numberOfRating==0){
				user.averageRating = 0;
			} else {
				user.averageRating = user.totalRating / user.numberOfRating;
			}
			User.findOneAndUpdate(conditions, user, options, function(err){
				if(err){
					callback(false,err);
					return;
				} else {
					callback(true,"OK");
					return;
				}
			});
		}
	});
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
	newProfile.password.enabled = true;
	delete newProfile.password.plain;

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

AccountManager.prototype.log = function(user, callback){
	debug(user);
	User.findOneAndUpdate({_id: user.id}, user, function(err){
		if(err){
			callback(false, err);
			return;
		} else {
			callback(true,"OK");
			return;
		}
	})
}

AccountManager.prototype.searchUser = function(keyword, callback){
	User.find({ $text: { $search: keyword} },'_id email displayName', function(err, users){
		if(err){
			debug(err);
			callback(false,err);
		} else {
			callback(true,users);
		}
	})
	/*
	User.textSearch(keyword, function(err, result){
		if(err){
			debug(err);
			callback(false, err);
		} else {
			var users;
			for (i in result.results){
				debug(result.results[i].score);
				users[i] = result.results[i].obj;
			}
			callback(true,users);
		}
	});
	*/
}

function filterUserProfile(profile){
	debug('filterUserProfile called!')
	if(profile.hasOwnProperty("displayName")){
		profile.displayName = xssFilters.inHTMLData(profile.displayName);
	}
	if(profile.hasOwnProperty("description")){
		profile.description = xssFilters.inHTMLData(profile.description);
	}
	if(profile.hasOwnProperty("profilePic")){
		profile.profilePic = xssFilters.uriPathInDoubleQuotedAttr(profile.profilePic);
		profile.profilePic = profile.profilePic.replace("x-data", "data");
	}
	return profile;
}

module.exports = AccountManager;
