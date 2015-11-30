var profilePicBuffer = undefined;

function showPasswordInfo(type, msg){
  var head = "";
  if(type=="success"){
    head = "Yay!";
  } else if(type=="danger"){
    head = "Opps!"
  }
  $("#password-info").removeClass("hidden");
  $("#password-info").html("<div class='alert alert-"+type+" alert-dismissible' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button><strong>"+head+" </strong>"+msg+"</div>");
}

function isValidProfile(profile){

  // description
  if(String(profile.description).length > 500){
    alert("Description must be less than 500 characters!");
    window.location.reload();
    return false;
  }

  return true;

}

var map, map2;
function initMap() {
  var data = $('#fromWhere').data('info');
  data = data.split(",");
  var from = {lat: Number(data[0]), lng: Number(data[1])};
  var to = {lat: Number(data[2]), lng: Number(data[3])};
  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 6,
    center: from
  });

  var markerFrom = new google.maps.Marker({
    position: from,
    map: map,
    title: 'From',
  });

  var markerTo = new google.maps.Marker({
    position: to,
    map: map,
    title: 'To',
  });

  var lineSymbol = {
    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
  };

  // Create the polyline and add the symbol via the 'icons' property.
  var line = new google.maps.Polyline({
    path: [from, to],
    icons: [{
      icon: lineSymbol,
      offset: '100%'
    }],
    map: map
  });

  data = $('#fromUserWhere').data('info');
  data = data.split(",");
  from = {lat: Number(data[0]), lng: Number(data[1])};
  to = {lat: Number(data[2]), lng: Number(data[3])};
  var map2 = new google.maps.Map(document.getElementById('map2'), {
    zoom: 6,
    center: from
  });

  var markerFrom = new google.maps.Marker({
    position: from,
    map: map2,
    title: 'From',
  });

  var markerTo = new google.maps.Marker({
    position: to,
    map: map2,
    title: 'To',
  });

  var lineSymbol = {
    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
  };

  // Create the polyline and add the symbol via the 'icons' property.
  var line = new google.maps.Polyline({
    path: [from, to],
    icons: [{
      icon: lineSymbol,
      offset: '100%'
    }],
    map: map2
  });
}

$(document).on('change', '#profilePic', function() {
  var reader = new FileReader();

    reader.onload = function (e) {
        $("#profilePic_preview").attr('src', e.target.result);
        $("#profilePic_buffer").attr('src', e.target.result);

        var canvas = document.getElementById("canvas");
        var img = document.getElementById("profilePic_buffer");;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        var MAX_WIDTH = 300;
        var MAX_HEIGHT = 300;
        var width = img.width;
        var height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        var dataurl = canvas.toDataURL("image/png");
        profilePicBuffer = dataurl;

    };

    reader.readAsDataURL(this.files[0]);

    
    //Post dataurl to the server with AJAX
});

$( document ).ready( function(){
  $.ajax({
    type: "GET",
    url: "/api/users/"+$('#profilePic_preview').data('id')+"/profilePic",
    success: function(data){
      $('#profilePic_preview').attr("src",data);
    },
    error: function(jqxhr, textStatus, errorThrown){
      alert(errorThrown);
    }
  });

  //editable

  $('#displayName').editable({
    type: 'text',
    pk: 1,
    title: 'Enter your name to be displayed:'
  });

  $('#description').editable({
    type: 'textarea',
    pk: 2,
    title: 'Introduce yourself:'
  });

  $('#userType').editable({
    type: 'select',
    pk: 3,
    title: 'Set user as:',
    source: [
      {value:0, text:"User"},
      {value:1, text:"Administrator"}
    ]
  });

  $('.editable').editable('disable');

  // menu
  $('#edit').click(function(){
    $('.editable').editable('enable');    
    $('#edit').addClass('hidden');
    $('.edit-menu').removeClass('hidden');
  });

  $('#delete').click(function(){
    $.ajax({
      type: "DELETE",
      url: "/api/users/"+$('#profilePic_preview').data('id'),
      success: function(data){
        window.location.href="/users";
      },
      error: function(jqxhr, textStatus, errorThrown){
        alert(errorThrown);
      }
    });
  });

  $('#cancel').click(function(){
    location.reload();
  });

  $('#submit').click(function(){
    $(".editableform-loading").removeClass('hidden');
    $(".edit-menu").addClass('hidden');

    var userType = $('#userType').editable('getValue').userType;

    var profile = {
      _id: $('#profile').data('value'),
      displayName: $('#displayName').html(),
      description: $('#description').html(),
      userType: userType,
      profilePic: profilePicBuffer
    }

    if(profile.profilePic == undefined){
      delete profile.profilePic;
    }

    if(isValidProfile(profile)){
      $.ajax({
        type: "PATCH",
        url: "/api/users/"+profile._id,
        data: {json: JSON.stringify(profile)},
        success: function(data){
          $(".editableform-loading").addClass('hidden');
          window.location.reload();
        },
        error: function(jqxhr, textStatus, errorThrown){
          alert(errorThrown);
          $(".editableform-loading").addClass('hidden');
        }
      });  
    }

    
  });

  $('#changePassword').click(function(){

    // check new password valid
    if($('#newPassword').val() != $('#confirmPassword').val()){
      showPasswordInfo("danger","New password inconsistent!");
      $('#newPassword').val("");
      $('#confirmPassword').val("");
      return;
    }

    if($('#oldPassword').val()==""){
      showPasswordInfo("danger","Please enter the original password!");
      return;
    }

    if($('#newPassword').val()==""){
      showPasswordInfo("danger","Please fill in a new password!");
      return;
    }

    var profile = {
      id: $('#profile').data('value'),
      password: $('#newPassword').val(),
      oldPassword: $('#oldPassword').val()
    }

    $.ajax({
      type: "PUT",
      url: "/api/changePassword",
      data: {json: JSON.stringify(profile)},
      success: function(data){
        showPasswordInfo("success","Your password has been changed.");
        $('#oldPassword').val("");
        $('#newPassword').val("");
        $('#confirmPassword').val("");
      },
      error: function(jqxhr, textStatus, errorThrown){
        showPasswordInfo("danger","Can't change password: " + errorThrown);
        $('#oldPassword').val("");
        $('#newPassword').val("");
        $('#confirmPassword').val("");
      }
    });
  });

});

$.fn.editable.defaults.mode = 'inline';