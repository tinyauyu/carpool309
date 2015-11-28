$(document).ready(function () {
    $(".slide").click(function() {
        if($(this).children().hasClass("glyphicon-chevron-down")) {
            $(this).children().removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
        } else {
            $(this).children().removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
        }
    });
});

$(document).ready(function() {
    $('#removeBox').click(function () {
        $("#resultPanel").addClass("hidden");
        location.reload();
    });
});


// $(document).ready( function(){
//     $.ajax({
//         type: "GET",
//         url: "/api/users/"+$('#profilePic_preview').data('id')+"/profilePic",
//         success: function(data){
//           $('#receiverImg').attr("src",data);
//         },
//         error: function(jqxhr, textStatus, errorThrown){
//           alert(errorThrown);
//         }
//     });
// });

// var socket = io();
var sender = $('.navbar-brand').attr('loggedInUser');
socket.emit('register', {sender: sender});
var receiver;

$(document).ready( function(){
    $('form#inputMsg').submit(function() {
        var msg = $('#msg').val();
        var attr = $('button#chat').attr('receiver');
        if(typeof attr !== typeof undefined && attr !== false){
            receiver =  $('button#chat').attr("receiver");
        } else {
            receiver = $('#resultPanel').attr('sendto');
        };

        $('#messages').append($('<li>').text(msg));
        var data = {
            sender: sender,
            receiver: receiver,
            msg: msg
        };

        socket.emit('chat message', data);
        $('#msg').val('');
        return false;
    });
});

socket.on('chat message', function(data) {
    if ($("#resultPanel").is(':visible') && $("#resultPanel").attr('sendto') == data.sender) {
        $('#messages').append($('<li>').text(data.msg));
        $.ajax({
          type: "POST",
          url: "/api/markMsgRead/" + data.sender + "/" + data.receiver + "/",
          success: getUnreadMsgs
        });
    }
});