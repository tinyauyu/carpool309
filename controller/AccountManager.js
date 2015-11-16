var mongoose = require('mongoose');
var path = require('path');
var bcrypt = require('bcrypt');
var salt = bcrypt.genSaltSync(10);

var UserSchema = mongoose.Schema({
	id: {type:Number, required: true},
	userType: {type:Number, required: true},
	email: {type:String, required: true, trim: true},
	passwordHash: {type:String, required: true},
	description: String,
	profilePic: Buffer,
	displayName: String,
	behavior: {
		ip_addr: String,
		browser: String,
		os: String,
		mobile: String,
		screenSize: String,
		location: {
			latitude: Number,
			longitude: Number
		},
	},
	pageHistory:[String]
});

var User = mongoose.model('User', UserSchema);

var nextId = -1;

function AccountManager(url){  //mongodb://localhost/
	mongoose.connect(url);
	this.db = mongoose.connection;
	this.db.on('error', console.error.bind(console, 'connection error:'));
	this.db.once('open', function (callback) {
		console.log("[info]\t[AccountManager.js]\tConnected to mongodb!");
	});
	User.findOne({}).sort('-id').exec(function (err, user) {
		nextId = user.id+1;
  	});
}

AccountManager.prototype.login = function(profile, callback){
	console.log('[info]\t[AccountManager.js]\tLogin attempt by '+ profile.email);

	User.findOne({ email: profile.email }, function(err, user) {
	    if (!user) {
	    	console.log('[info]\t[AccountManager.js]\tNo such email registered');
	    	callback(false,"Invalid email or password");
	    } else {
	      if (bcrypt.compareSync(profile.password, user.passwordHash)) {
	      	console.log('[info]\t[AccountManager.js]\tLogin success!');
	        callback(true,user);
	      } else {
	      	console.log('[info]\t[AccountManager.js]\tWrong Password!');
	        callback(false,"Invalid email or password");
	      }
	    }
	});

}

AccountManager.prototype.getUserList = function(callback){
	User.find({},'id email displayName', function(err, users){
		if(err) {throw err;}

		callback(users);
	})
}

AccountManager.prototype.getUser = function(id,callback){
	User.findOne({id: id}, function(err, user){
		if(err) {throw err;}
		if(!user){
			callback(false,null)
		} else {
			callback(true,user);
		}
	})
}

AccountManager.prototype.getUserPic = function(id,callback){
	console.log("find user #"+id+" profile pic");
	User.findOne({id: id},'profilePic', function(err, user){
		if (err) {throw err;}
		if(!user){callback(null)} else {
			callback(user.profilePic);
		}
	})
}

AccountManager.prototype.createUser = function(profile, callback){
	console.log('[info]\t[AccountManager.js]\tcreating user...');

	if(nextId <= 0){
		callback(false,"Server initializing, please try again later.")
	}

	User.count({}, function(err, count){

		if(profile.email == ""){
			callback(false,"Please fill in the email address!");
			return;
		}
		if(profile.password == ""){
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
				if(count==0){userType = 2;}


				var passwordHash = bcrypt.hashSync(profile.password, salt);

				var newUser = new User({
					id: nextId,
					userType: userType,
					email: profile.email,
					passwordHash: passwordHash,
					description: profile.description,
					displayName: profile.displayName,
					profilePic: profilePic
				});

				newUser.save(function(error, data){
			    	if(error){
			    		console.log("[ERROR]\t[AccountManager.js]\tCannot save user to database: " + error);
			        	callback(false,"Internal Server Error");
			        	return;
			    	} else {
			    		console.log("[info]\t[AccountManager.js]\tUser #"+count+" ("+profile.email+") created.")
			    		nextId++;
			    	    callback(true,"OK");
			    	    return;
			    	}
				});
			}
		});
	});
}

AccountManager.prototype.deleteUser = function(user, profile, callback){
	if(user.id == profile.id){
		callback(false,"You cannot delete your own account!");
		return;
	}
	this.checkAccessRight(user, profile, function(isAuth){
		if(isAuth){
			User.findOneAndRemove({id: profile.id}, function(err){
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

	if(user.id == profile.id){
		callback(true);
		return;
	}

	User.findOne({id: user.id}, 'userType', function(err, u){
		user_type = u.userType;
		User.findOne({id: profile.id}, 'userType', function(err, p){
			profile_type = p.userType;
			console.log("accessRight: user="+user_type + "  |  profile=" + profile_type);

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
			console.log("Invalid access attempt by user#"+user.id);
			console.log('5');
			callback(false,"You have no right to update this profile!");
			return;
		} else {
			// check field to update
			User.findOneAndUpdate({id: profile.id}, profile, function(err){
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

	if(profile.password==""){
		callback(false, "New Password cannot be empty!");
		return;
	}

	var passwordHash = bcrypt.hashSync(profile.password, salt);

	var newProfile = profile;
	newProfile.passwordHash = passwordHash;
	delete newProfile.password;

	User.findOneAndUpdate({id: profile.id}, profile, function(err){
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
	User.findOneAndUpdate({id: user.id}, user, function(err){
		if(err){
			callback(false, err);
			return;
		} else {
			callback(true,"OK");
			return;
		}
	})
}

AccountManager.prototype.logPage = function(user, page){

	var update = {
		$push: {"pageHistory":page}
	};

	User.findOneAndUpdate({id: user.id}, update, function(err){
		if(err){
			console.log("!!!>>>>>>Page log failed! " + err);
			return;
		} else {
			console.log("!!!>>>>>>Page log ok!");
			return;
		}
	})
}

module.exports = AccountManager;