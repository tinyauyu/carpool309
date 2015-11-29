$( document ).ready( function(){
  console.log('nav.js');
  $.ajax({
    type: "GET",
    url: "/api/users/current/profilePic",
    success: function(data){
      $('#nav-profilePic').attr("src",data);
    },
    error: function(jqxhr, textStatus, errorThrown){
      alert(errorThrown);
    }
  });
});

var socket = io();
var sender = $('.navbar-brand').attr("loggedInUser");
socket.emit('register', {sender: sender});

socket.on('chat message', function(data) {
  $('.W_new_count').removeClass("hidden");

});