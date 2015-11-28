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

function showChatWindow(data, msgs) {
    $("#resultPanel").html(data.window);
    $("#resultPanel").attr('sendto', data.user.email);
    for (i = 0; i < msgs.length; i++) {
      var msg = msgs[i];
      if (msg.sender == data.user.email) {
        $('#messages').append($('<li>').text(msg.content));
      }
    }
}

function getLoggedInUser() {
  return $('.navbar-brand').attr("loggedInUser");
}

function getUnreadMsgs() {
    var loggedInUser = getLoggedInUser();

    var loadUnreadMessages = function(msgs) {
      var msgsJson = JSON.parse(msgs);

      var msgsLength = msgsJson.length;
      if (msgsLength == 0) {
        $('.W_new_count').addClass("hidden");
        return;
      }
      $('.W_new_count').removeClass("hidden");
      $('#newMsgList').removeClass("hidden");
      $('#newMsgList').empty();

      var unreadUsers = [];
      for (i = 0; i < msgsLength; i++) {
        var msg = msgsJson[i];
        var sender = msg.sender;
        if (unreadUsers.indexOf(sender) != -1) {
          continue;
        }
        unreadUsers.push(sender);
        var ele = $('<li>');
        ele.text(sender);
        $('#newMsgList').append(ele);
        ele.click(function() {
          $("#resultPanel").removeClass("hidden");
          ele.remove();
          var sender = ele.text();
          $.ajax({
            type: "POST",
            url: "/api/markMsgRead/" + sender + "/" + loggedInUser + "/",
            success: getUnreadMsgs
          });
          $.ajax({
            type: "GET",
            datatype: "json",
            url: "/api/users/" + sender + "/chatWindow/",
            success: function(data) {
              showChatWindow(data, msgsJson);
            }
          });
        });
      }
    }

    $.ajax({
      type: "GET",
      datatype: "json",
      url: "/api/unreadmessage/" + loggedInUser + "/",
      success: loadUnreadMessages
    });
}

socket.on('chat message', function(data) {
  if ($("#resultPanel").is(':visible') && $("#resultPanel").attr('sendto') == data.sender) {
    return;
  }
  getUnreadMsgs();
});
