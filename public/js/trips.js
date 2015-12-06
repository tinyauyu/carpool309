$(document).ready(function(){
/*----------------------------------------------------------------
If certain trip clicked, get the trip id and go to 
speicially designed user profile page
-----------------------------------------------------------------*/
  $('.trip-row').click(function(){
      var ids = $(this).data('id');
      var url = "/users/" + ids;
      window.location.href = url;
  });

/*----------------------------------------------------------------
Same thing as above, but click on similar users
-----------------------------------------------------------------*/
   $('.similar-trip-row').click(function(){
      var ids = $(this).data('id');
      var url = "/users/" + ids;
      window.location.href = url;
  });
});