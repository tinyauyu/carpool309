$(document).ready(function () {
  $(".slide").click(function() {
    if($(this).children().hasClass("glyphicon-chevron-down")) {
        $(this).children().removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
    } else {
        $(this).children().removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
    }
  });
});

var socket = io();
$('form').submit(function(){
    socket.emit('chat message', $('#msg').val());
    $('#msg').val('');
    return false;
  });