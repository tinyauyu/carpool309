var assert = require('assert');
var http = require('http');
var server = require('./server');
var fs = require('fs');
var request = require('request');
var ajax = require('ajax-request');
var $ = require('jquery');
var querystring = require('querystring');

//create managers for testing
var MONGODB_URL = 'mongodb://localhost/';
var FeedbackManager = require('./controller/FeedbackManager.js');
var feedbackManager = new FeedbackManager(MONGODB_URL);
var AccountManager = require('./controller/AccountManager.js');
var acManager = new AccountManager(MONGODB_URL);
var MessageManager = require('./controller/MessageManager.js');
var msgManager = new MessageManager(MONGODB_URL, server);
var TripManager =  require('./controller/TripManager.js');
var tripManager = new TripManager(MONGODB_URL);

//read the main page file
var indexHtml = null;
fs.readFile('./public/getStarted.html', function(err, data){
	if(err){
		indexHtml = 'error reading main page:' + JSON.stringify(err, null, 4);
	}
	else{
		indexHtml = data;
	}
	return;
});


var cookie = 'something=anything'
var header = {};
describe('HTTP Server Test', function(){
  after(function(){
    server.close();
  });

  describe('test home page', function(){
    it('should return start page', function(done){
      http.get('http://localhost:3000', function(response){
        //assert the status code
        assert.equal(response.statusCode, 200);
        var body = '';
        response.on('data', function(d){
          body += d;
        });
        response.on('end', function(){
          assert.equal(body, indexHtml);
          //console.log(body);
          done();
        });
      });
    });
  });

	describe('test AccountManager', function(){
		var profile = {
			email:'test@test.com',
			password:{
				plain: 'test'
			}
		}
		it('should create user', function(done){
			acManager.createUser(profile, function(success, msg){
				done();
			});
		});
		it('should be able to login user correctly', function(done){
			acManager.login(profile, function(success, msg){
				//console.log(msg);
				if(success){done();}
			});
		});
		it('should get the user by email', function(done){
			acManager.getUserByEmail(profile.email, function(success, msg){
				assert.equal(msg.email, profile.email);
				done();
			});
		});
	});

  describe('test login API', function(){
    it('should login', function(done){

      userInfo = {email: 'test@test.com', password:{
          plain:'test'
      }};
      var post_data = querystring.stringify({
        'json' : JSON.stringify(userInfo)
      });
      var post_options = {
       host: 'localhost',
       port: '3000',
       path: '/api/login',
       cookie: cookie,
       method: 'POST',
       headers: {
           'Content-Type': 'application/x-www-form-urlencoded',
           'Content-Length': Buffer.byteLength(post_data)
       }
      };
      var post_req = http.request(post_options, function(res) {
        cookie = res.headers['set-cookie'];
        header = res.headers;
        //console.log(cookie);
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            //console.log('Response: ' + chunk);
        });
        res.on('end', function(){
          var get_options = {
           host: 'localhost',
           port: '3000',
           path: '/api/users/0/feedbacks',
           method: 'GET',
           headers: header
          };
          var req = http.request(get_options, function(response){
            var body = '';
            response.on('data', function(d){
              body += d;
            });
            response.on('end', function(){
              //console.log(body);
              done();
            });
          });
          req.end();
        })
      });
      // post the data to server
      post_req.write(post_data);
      post_req.end();
    });

		it('should login fail when wrong email', function(done){

      userInfo = {email: 'noexist@test.com', password:{
          plain:'test'
      }};
      var post_data = querystring.stringify({
        'json' : JSON.stringify(userInfo)
      });
      var post_options = {
       host: 'localhost',
       port: '3000',
       path: '/api/login',
       cookie: cookie,
       method: 'POST',
       headers: {
           'Content-Type': 'application/x-www-form-urlencoded',
           'Content-Length': Buffer.byteLength(post_data)
       }
      };
      var post_req = http.request(post_options, function(res) {
        cookie = res.headers['set-cookie'];
        header = res.headers;
        //console.log(cookie);
        res.setEncoding('utf8');
				var body ='';
        res.on('data', function (chunk) {
            //console.log('Response: ' + chunk);
						body += chunk;
						//console.log(body);
        });
        res.on('end', function(){
					assert.equal('Invalid email or password',body);
					done();
        });
      });
      // post the data to server
      post_req.write(post_data);
      post_req.end();
    });
		it('should login fail when wrong password', function(done){

      userInfo = {email: 'test@test.com', password:{
          plain:'wrong password'
      }};
      var post_data = querystring.stringify({
        'json' : JSON.stringify(userInfo)
      });
      var post_options = {
       host: 'localhost',
       port: '3000',
       path: '/api/login',
       cookie: cookie,
       method: 'POST',
       headers: {
           'Content-Type': 'application/x-www-form-urlencoded',
           'Content-Length': Buffer.byteLength(post_data)
       }
      };
      var post_req = http.request(post_options, function(res) {
        cookie = res.headers['set-cookie'];
        header = res.headers;
        //console.log(cookie);
        res.setEncoding('utf8');
				var body ='';
        res.on('data', function (chunk) {
            //console.log('Response: ' + chunk);
						body += chunk;
						//console.log(body);
        });
        res.on('end', function(){
					assert.equal('Invalid email or password',body);
					done();
        });
      });
      // post the data to server
      post_req.write(post_data);
      post_req.end();
    });
  });

  describe('test feedback api', function(){
    it('should response', function(done){
      var get_options = {
       host: 'localhost',
       port: '3000',
       path: '/api/users/0/feedbacks',
       method: 'GET',
      };
      var req = http.request(get_options, function(response){
        var body = '';
        response.on('data', function(d){
          body += d;
        });
        response.on('end', function(){
          done();
        });
      });
      req.end();
    });
  });
  describe('test userlist api', function(){
    it('should response', function(done){
      var get_options = {
       host: 'localhost',
       port: '3000',
       path: '/api/users',
       method: 'GET',
      };
      var req = http.request(get_options, function(response){
        var body = '';
        response.on('data', function(d){
          body += d;
        });
        response.on('end', function(){
          done();
        });
      });
      req.end();
    });
  });
	describe('test delete user api', function(){
    it('should response', function(done){
      var get_options = {
       host: 'localhost',
       port: '3000',
       path: '/api/users/0',
       method: 'DELETE',
      };
      var req = http.request(get_options, function(response){
        var body = '';
        response.on('data', function(d){
          body += d;
        });
        response.on('end', function(){
					assert.equal('Found. Redirecting to /',body);
          done();
        });
      });
      req.end();
    });
  });
	describe('test logout user api', function(){
    it('should response', function(done){
      var get_options = {
       host: 'localhost',
       port: '3000',
       path: '/api/logout',
       method: 'GET',
      };
      var req = http.request(get_options, function(response){
        var body = '';
        response.on('data', function(d){
          body += d;
        });
        response.on('end', function(){
					assert.equal('Found. Redirecting to /',body);
          done();
        });
      });
      req.end();
    });
  });
	describe('test wrong api address', function(){
    it('should response', function(done){
      var get_options = {
       host: 'localhost',
       port: '3000',
       path: '/api/wrongapi',
       method: 'GET',
      };
      var req = http.request(get_options, function(response){
        var body = '';
        response.on('data', function(d){
          body += d;
        });
        response.on('end', function(){
					assert.equal('Found. Redirecting to /',body);
          done();
        });
      });
      req.end();
    });
  });

  describe('test message manager', function(){
    it('should get message by email', function(done){
      msgManager.getUnreadMsgsForUser('test@test.com',
			function(success, msg){
        if(success){
          done();
        }
      })
    });
		it('should get message by email corner case', function(done){
      msgManager.getUnreadMsgsForUser('noexist@test.com',
			function(success, msg){
        if(success){
          done();
        }
      })
    });
		it('should get conversation for 2 users', function(done){
      msgManager.getConversation(0, 1,
				function(success, msg){
        if(success){
          done();
        }
      })
    });
		it('should get conversation corner case', function(done){
      msgManager.getConversation(0, 0,
				function(success, msg){
        if(success){
          done();
        }
      })
    });
		it('should get conversation corner case2', function(done){
      msgManager.getConversation(10000000000, 10000000000,
				function(success, msg){
        if(success){
          done();
        }
      })
    });
  });

  describe('test trip manager', function(){

    var trip = {
      user: 0,
    	startPoint:{latitude: 100, longitude: 100},
    	endPoint:{latitude: 110, longitude: 100},
    	date: '2015/01/01',
    	price: 15,
    	provider: 'tester'
		};
      it('should create new trip', function(done){
          tripManager.updateTrip(trip,
						function(success, msg){
            if(success){
              done();
            }
          });
      });
      it('should search trip', function(done){
        tripManager.searchTrip(0,
					function(success, msg){
          if(success){
            done();
          }
        });
      });
      it('should recommend trip', function(done){
        tripManager.searchSimilarTrip(0,
					function(success, msg){
          if(success){
            done();
          }
        });
      });
      it('should calculate distance',
			function(done){
        var result = TripManager.findOneDistance(100, 100, 110, 100);
        assert.equal(12405227.292647015, result);
        done();
      });
      it('should calculate distance corner case',
			function(done){
        var result = TripManager.findOneDistance(100, 100, 100, 100);
        assert.equal(0, result);
        done();
      });
      it('should calculate distance corner case2',
			function(done){
        var result = TripManager.findOneDistance(0, 0, 0, 0);
        assert.equal(0, result);
        done();
      });
			it('should calculate user distance',
			function(done){
        var result = TripManager.findDistance(trip, trip);
        assert.equal(0, result);
        done();
      });
			var trip2 = {
	      user: 0,
	    	startPoint:{latitude: 100, longitude: 110},
	    	endPoint:{latitude: 110, longitude: 110},
	    	date: '2015/01/01',
	    	price: 15,
	    	provider: 'tester'
			};
			it('should calculate user distance',
			function(done){
        var result = TripManager.findDistance(trip, trip2);
        assert.equal(572733.1463071385, result);
        done();
      });
			it('should find all trips',
			function(done){
				tripManager.findAllTrips(
					function(success, data){
					if(success){
							//console.log(data);
							done();
					}
				});
			});
			it('should find all trips by user',
			function(done){
				tripManager.findAllTripsByUser(0,
					function(success, data){
					if(success){
							done();
					}
				});
			});

  });
  describe('test feedback manger',
	function(){
    var feedbacks;
    it('should insert feedback',
		function(done){
       feedbacks = { comment: 'testing feedback',
            rating: '5',
            sender: 0,
            receiver: '0',
            date: 'Fri Dec 04 2015 15:24:51 GMT-0500 (EST)' };
      //createFeedback
      feedbackManager.createFeedback(feedbacks,
				function(success, data){
					if(success){
        		done();
					}
      });
    });
		it('should create feedback fail with no sender',
		function(done){
       var feedbackwrong = { comment: 'wrong testing feedback',
            rating: '5',
            sender: undefined,
            receiver: 1,
            date: 'Fri Dec 04 2015 15:24:51 GMT-0500 (EST)' };
      //createFeedback
      feedbackManager.createFeedback(feedbackwrong,
				function(success, data){
					assert(!success);
					assert.equal('Feedback must have a sender.', data);
					done();
      });
    });
		it('should create feedback fail with no comment',
		function(done){
       var feedbackwrong = { comment: '',
            rating: '5',
            sender: 0,
            receiver: 1,
            date: 'Fri Dec 04 2015 15:24:51 GMT-0500 (EST)' };
      //createFeedback
      feedbackManager.createFeedback(feedbackwrong,
				function(success, data){
					assert(!success);
					assert.equal('Feedback must contain either comment or rating.'
						, data);
					done();
      });
    });
		it('should create feedback fail with no rating',
		function(done){
       var feedbackwrong = { comment: '',
            rating: null,
            sender: 0,
            receiver: 1,
            date: 'Fri Dec 04 2015 15:24:51 GMT-0500 (EST)' };
      //createFeedback
      feedbackManager.createFeedback(feedbackwrong,
				function(success, data){
					assert(!success);
					assert.equal('Feedback must contain either comment or rating.'
						, data);
					done();
      });
    });

    //make sure we insert correctly
    var feedBackId;
    it('should get the feedback',
		function(done){
      feedbackManager.getFeedbackByUser(0,
				function(success, data){
        for(var i = 0; i < data.length; i++){
          if(data[i].comment == 'testing feedback'){
            feedBackId = data[i]._id;
            assert.equal(data[i].rating.toString(), feedbacks.rating);
            assert.equal(data[i].date, feedbacks.date);
          }
        }
        done();
      });
    });

    it('should remove the feedback',
		function(done){
      feedbackManager.deleteFeedbackById(feedBackId,
				function(success, msg){
        done();
      });
    });
  });
});
