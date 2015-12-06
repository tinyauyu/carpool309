var profilePicBuffer = null;
/*--------------------------------------------------------------
on change profile ficutre
---------------------------------------------------------------*/
$(document).on('change', '#profilePic', function() {
  var reader = new FileReader();

    reader.onload = function (e) {
        $("#profilePic_preview").attr('src', e.target.result);
        $("#profilePic_buffer").attr('src', e.target.result);

    };

    reader.readAsDataURL(this.files[0]);
});

/*--------------------------------------------------------------
get the base 64 of the image 
---------------------------------------------------------------*/
function getBase64Image(img) {
    // Create an empty canvas element
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    // Copy the image contents to the canvas
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // Get the data-URL formatted image
    // Firefox supports PNG and JPEG. You could check img.src to guess the
    // original format, but be aware the using "image/jpg" will re-encode the image.
    var dataURL = canvas.toDataURL("image/png");

    return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
}

/*--------------------------------------------------------------
DISPLAY CPRRESPONDING LAERT
---------------------------------------------------------------*/
function showAlert(msg){
	$(".alertBox:visible").html("<div class='alert alert-danger alert-dismissible' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button><strong>Oops! </strong>"+msg+"</div>");
}

/*--------------------------------------------------------------
helper funciton for regular expression and 
check for correct email address format
---------------------------------------------------------------*/
function isValidEmailAddress(emailAddress) {
    var pattern = /^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
    return pattern.test(emailAddress);
};

/*--------------------------------------------------------------
Check the profile updated is valid 
---------------------------------------------------------------*/
function isValidProfile(profile){
	// email
	if(!isValidEmailAddress(profile.email)){
		showAlert("Please enter a valid email address!");
		return false;
	}

	// password
	if(profile.password.plain==""){
		showAlert("Please fill in your password!");
		return false;
	}
	var confirmPassword = $("#confirm_password").val();
	if(confirmPassword!=profile.password.plain){
		showAlert("Password does not match!");
		return false;
	}

	// description
	if(String(profile.description).length > 500){
		showAlert("Description must be less than 500 characters!");
		return false;
	}

	return true;

}
/*--------------------------------------------------------------
If login clicked get the data and check for correct user
---------------------------------------------------------------*/
$('#login').click(function(){
	var profile = {
		email: $('#login-email').val(),
		password:{plain: $('#login-password').val()}

	};

	$.ajax({
		type: "POST",
		url: "./api/login",
		data: {json: JSON.stringify(profile)},
		success: function(data){
			window.location.href = "/users";
		},
		error: function(jqxhr, textStatus, errorThrown){
			showAlert(errorThrown);
		}
	});
});

/*--------------------------------------------------------------
Get corresponding info about the user
check the info correctness if correct pass into the server
---------------------------------------------------------------*/
$('#submit').click(function(){

	// get profile pic

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

	var profile = {
		email: $('#email').val(),
		password:{plain: $('#password').val()},
		description: $('#description').val(),
		displayName: $('#displayName').val(),
		profilePic: profilePicBuffer
	}
	if(isValidProfile(profile)){
		$.ajax({
			type: "POST",
			url: "/api/users",
			data: {json: JSON.stringify(profile)},
			success: function(){
				$.ajax({
					type: "POST",
					url: "/api/login",
					data: {json: JSON.stringify(profile)},
					success: function(data){
						window.location.href = "/users";
					}
				});
			},
			error: function(jqxhr, textStatus, errorThrown){
				showAlert(errorThrown);
			}
		});
	}

});

/*--------------------------------------------------------------
Get some style ready
and choose which to show
---------------------------------------------------------------*/
$( document ).ready( function(){
	$('input').css('background-color', 'rgba(255,255,255,0.8)');
	$('textarea').css('background-color', 'rgba(255,255,255,0.8)');
	$('#registerUI').click(function(){
        $('#loginModal').removeClass('show');
        $('#registerModal').addClass('show');
    });

    $('#loginUI').click(function(){
        $('#loginModal').addClass('show');
        $('#registerModal').removeClass('show');
    });
});