
$(document).on('click','.slide' ,function() {
    if($(this).children().hasClass("glyphicon-chevron-down")) {
        $(this).children().removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
    } else {
        $(this).children().removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
    }
});


$(document).on('click', '#removeBox', function () {
    $("#resultPanel").addClass("hidden");
    location.reload();
});

var sender = $('.navbar-brand').attr('loggedInUser');
socket.emit('register', {sender: sender});
var receiver;


$(document).on('click', '#msgButton', function() {
    console.log("aaaaaaa");
    var msg = $('#msg').val();
    var attr = $('button#chat').attr('receiver');
    if(typeof attr !== typeof undefined && attr !== false){
        receiver =  $('button#chat').attr("receiver");
    } else {
        receiver = $('#resultPanel').attr('sendto');
    };
    var ele = $('<p>');
    $('#messages').append(ele.text(msg));
    ele.attr('id', 'msgYouSend');
    var data = {
        sender: sender,
        receiver: receiver,
        msg: msg
    };

    socket.emit('chat message', data);
    $('#msg').val('');
    return false;
});

socket.on('chat message', function(data) {
    console.log("bbbbbbbbbb");
    if ($("#resultPanel").is(':visible') && $("#resultPanel").attr('sendto') == data.sender) {
        var ele = $('<p>');
        $('#messages').append(ele.text(data.msg));
        ele.attr('id', 'msgYouGet');
        $.ajax({
          type: "POST",
          url: "/api/markMsgRead/" + data.sender + "/" + data.receiver + "/",
          success: getUnreadMsgs
        });
    }
});


