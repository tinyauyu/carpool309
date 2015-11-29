$(document).ready(function(){
  $('.trip-row').click(function(){
      var ids = $(this).data('id');
      var url = "/users/" + ids;
      window.location.href = url;
  });
});