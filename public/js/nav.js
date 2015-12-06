$( document ).ready( function(){
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

/* show chat window in page's resultPanel div */
function showChatWindow(data) {
  $("#resultPanel").removeClass("hidden");

  var sender = data.user.email;
  var receiver = getLoggedInUser();
  var show = function(msgs) {
    msgs = JSON.parse(msgs);
    $("#resultPanel").html(data.window);
    $("#resultPanel").attr('sendto', sender);
    for (i = 0; i < msgs.length; i++) {
      var msg = msgs[i];
      var ele;
      var content;
      if (msg.sender == receiver) {
        //show messages you sent in chat body
        ele = $('<div id="chat-body" class="pull-right clearfix" style="width:260px">');
        content =$('<div class="pull-left clearfix" style="width:200px">');
        ele.append('<span class="chat-img pull-right"><img src="/img/me.png" alt="User Avatar" class="img-circle" /></span>');
        content.append($('<p id="time" style="text-align:right">').text(dateToStr(new Date(msg.date))));
        content.append($('<p id="text" style="text-align:right">').text(msg.content));
        ele.append(content);
        $("#messages").append(ele);

      } else {
        //show messages you get in chat body
        ele = $('<div id="chat-body" class="pull-left clearfix" style="width:260px">');
        content =$('<div class="pull-right clearfix" style="width:200px">');
        ele.append('<span class="chat-img pull-left"><img src="/img/u.png" alt="User Avatar" class="img-circle" /></span>');
        content.append($('<p id="time" style="text-align:left">').text(dateToStr(new Date(msg.date))));
        content.append($('<p id="text" style="text-align:left">').text(msg.content));
        ele.append(content);
        $("#messages").append(ele);
      }
    }

    var displayName = data.user.displayName;
    if (!displayName) {
      displayName = sender;
    }
    $("#displayName").text(displayName);
    $.ajax({
      type: "GET",
      url: "/api/users/"+data.user._id+"/profilePic",
      success: function(img){
        $('#receiverImg').attr("src", img);
          },
      error: function(jqxhr, textStatus, errorThrown) {
        alert(errorThrown);
      }
    });

  };

  $.ajax({
    type: "GET",
    url: "/api/getConversation/" + sender + "/" + receiver + "/",
    success: show
  });
}

function getLoggedInUser() {
  return $('.navbar-brand').attr("loggedInUser");
}

function getUnreadMsgs() {
    var loggedInUser = getLoggedInUser();

    var loadUnreadMessages = function(msgs) {
      var msgsJson = JSON.parse(msgs);

      var msgsLength = msgsJson.length;
      // no new message
      if (msgsLength == 0) {
        //hide new icon and sender list of new messages
        $('.W_new_count').addClass("hidden");
        $('#newMsgList').addClass("hidden");
        return;
      }

      //show ne icon and sender list
      $('.W_new_count').removeClass("hidden");
      $('#newMsgList').removeClass("hidden");
      $('#newMsgList').empty();

      var unreadUsers = [];
      for (i = 0; i < msgsLength; i++) {
        var msg = msgsJson[i];
        var sender = msg.sender;
        //if new message sender not already in the unreadUsers list
        if (unreadUsers.indexOf(sender) != -1) {
          continue;
        }
        //add new messages senders to the list
        unreadUsers.push(sender);
        var ele = $('<li>');
        ele.text(sender);
        $('#newMsgList').append(ele);

        //click to send ajax call to mark the message read
        ele.click(function() {
          ele.remove();
          var sender = ele.text();
          $.ajax({
            type: "POST",
            url: "/api/markMsgRead/" + sender + "/" + loggedInUser + "/",
            //if success, call getUnreadMsgs again
            success: getUnreadMsgs
          });
          $.ajax({
            type: "GET",
            datatype: "json",
            url: "/api/users/" + sender + "/chatWindow/",
            success: showChatWindow
          });
        });
      }
    };

    //load unread messages when login or when receive messages online.
    $.ajax({
      type: "GET",
      datatype: "json",
      url: "/api/unreadmessage/" + loggedInUser + "/",
      success: loadUnreadMessages
    });
}

socket.on('chat message', function(data) {
  //if chat window is open when get sender's messages 
  if ($("#resultPanel").is(':visible') && $("#resultPanel").attr('sendto') == data.sender) {
    // do not call getUnreadMsgs to show the notification
    return;
  }
  getUnreadMsgs();
});

/* time stamp builder */
function dateToStr(date) {
    var month = date.getMonth() + 1;
    var day = date.getDate();
    if (parseInt(day) < 10) {
        day = "0" + day;
    }
    var year = date.getFullYear();
    var hour = date.getHours();
    if (parseInt(hour) < 10) {
        hour = "0" + hour;
    }
    var min = date.getMinutes();
    if (parseInt(min) < 10) {
        min = "0" + min;
    }
    return year + "-" + month + "-" + day + ", " + hour + ": " + min; 
}
