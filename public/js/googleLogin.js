var isClickedSignIn = false;
    var isClickedSignUp = false;
    function onSignIn(googleUser){
      console.log(googleUser);

      if(!isClickedSignIn){
        return;
      }

      var profile = googleUser.getBasicProfile();
      var id_token = googleUser.getAuthResponse().id_token;
      var user = {
        email: profile.getEmail(),
        id_token: googleUser.getAuthResponse().id_token,
      }

      $.ajax({
        type: "POST",
        url: "/api/login/?type=google",
        data: {json: JSON.stringify(user)},
        success: function(data){
          var packet = JSON.parse(data);
          if(packet.isLogin==true){
            window.location.href = "/users"
          } else {

          }
        },
        error: function(jqxhr, textStatus, errorThrown){
          alert(errorThrown);
        }
      });
    } 

    $('#register').click(function(){
      $('#loginModal').removeClass('show');
      $('#registerModal').addClass('show');
    });

    $('#my-signin2').click(function(){
      isClickedSignIn = true;
    });

    function onSignUp(googleUser){
      
      var profile = googleUser.getBasicProfile();
      var id_token = googleUser.getAuthResponse().id_token;
      var user = {
        email: profile.getEmail(),
        displayName: profile.getName(),
        profilePic: profile.getImageUrl(),
        description: "created by Google",
        id_token: googleUser.getAuthResponse().id_token,
        password:{enabled:false}
      }
      $.ajax({
        type: "POST",
        url: "/api/users/?type=google",
        data: {json: JSON.stringify(user)},
        success: function(data){
          //window.location.href = "/users"
        },
        error: function(jqxhr, textStatus, errorThrown){
          alert(errorThrown);
        }
      });

    } 

    function onSuccess(googleUser) {
      console.log('Logged in as: ' + googleUser.getBasicProfile().getName());
    }
    function onFailure(error) {
      console.log(error);
    }
    function renderButton() {
      gapi.signin2.render('my-signin2', {
        'scope': 'https://www.googleapis.com/auth/plus.login',
        'width': 250,
        'height': 50,
        'longtitle': true,
        'theme': 'dark',
        'onsuccess': onSignIn,
        'onfailure': onFailure
      });
    }