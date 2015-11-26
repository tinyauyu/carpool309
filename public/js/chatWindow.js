$(document).ready(function () {
    $(".slide").click(function() {
        if($(this).children().hasClass("glyphicon-chevron-down")) {
            $(this).children().removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
        } else {
            $(this).children().removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
        }
    });
});

$(document).ready( function(){
    $.ajax({
        type: "GET",
        url: "/api/users/"+$('#profilePic_preview').data('id')+"/profilePic",
        success: function(data){
          $('#receiverImg').attr("src",data);
        },
        error: function(jqxhr, textStatus, errorThrown){
          alert(errorThrown);
        }
    });
});

var socket = io();
var sender = $('button#chat').attr("sender");
socket.emit('register', {sender: sender});

$(document).ready( function(){
    $('form#inputMsg').submit(function() {
        var msg = $('#msg').val();
        var receiver = $('button#chat').attr("receiver");
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
    $('#messages').append($('<li>').text(data.msg));
});