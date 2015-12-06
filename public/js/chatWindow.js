
$(document).on('click','.slide' ,function() {
    if($(this).children().hasClass("glyphicon-chevron-down")) {
        $(this).children().removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
    } else {
        $(this).children().removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
    }
});


$(document).on('click', '#removeBox', function () {
    //click to close chat window
    $("#resultPanel").addClass("hidden");
    location.reload();
});

var sender = $('.navbar-brand').attr('loggedInUser');
//register the logged in user as message sender when open the chat window
socket.emit('register', {sender: sender});
var receiver;

$(document).on('click', '#msgButton', function() {
    var msg = $('#msg').val();
    var attr = $('button#chat').attr('receiver');
    receiver = $('#resultPanel').attr('sendto');
    //show chat body messages, time you sent
    var ele = $('<div id="chat-body" class="pull-right clearfix" style="width:260px">');
    var content =$('<div class="pull-left clearfix" style="width:200px">');

    ele.append('<span class="chat-img pull-right"><img src="/img/me.png" alt="User Avatar" class="img-circle" /></span>');
    var curTime = new Date();

    content.append($('<p id="time" style="text-align:right">').text(dateToStr(curTime)));
    content.append($('<p id="text" style="text-align:right">').text(msg));
    ele.append(content);
    $("#messages").append(ele);

    //build messages info
    var data = {
        sender: sender,
        receiver: receiver,
        msg: msg,
        date: curTime
    };
    //emit the messages data you sent to server
    socket.emit('chat message', data);
    $('#msg').val('');

    return false;
});

// receive messages sent by others from server
socket.on('chat message', function(data) {
    //show chat body the messages you get
    if ($("#resultPanel").is(':visible') && $("#resultPanel").attr('sendto') == data.sender) {
        var ele = $('<div id="chat-body" class="pull-left clearfix" style="width:260px">');
        var content =$('<div class="pull-right clearfix" style="width:200px">');
        ele.append('<span class="chat-img pull-left"><img src="/img/u.png" alt="User Avatar" class="img-circle" /></span>');
        content.append($('<p id="time" style="text-align:left">').text(dateToStr(new Date(data.date))));
        content.append($('<p id="text" style="text-align:left">').text(data.content));
        ele.append(content);
        $("#messages").append(ele);
        $.ajax({
          type: "POST",
          url: "/api/markMsgRead/" + data.sender + "/" + data.receiver + "/",
          success: getUnreadMsgs
        });
    }
});
