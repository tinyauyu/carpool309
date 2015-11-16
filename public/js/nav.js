$( document ).ready( function(){
  console.log('nav.js');
  $.ajax({
    type: "GET",
    url: "/api/profilePic",
    success: function(data){
      $('#nav-profilePic').attr("src",data);
    },
    error: function(jqxhr, textStatus, errorThrown){
      alert(errorThrown);
    }
  });
});