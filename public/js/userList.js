$(document).ready(function(){

/*--------------------------------------------------------------------
Click close button to delete specific trip
---------------------------------------------------------------------*/
	$('.deleteTrip').click(function(){
		var id = $(this).data('id');
		//alert(id);
		var c = confirm("Are you sure to delete this trip (#"+id+")?");
		if(c){
			$.ajax({
				type: "DELETE",
				url: "/api/trips/" + id,
				success: function(){
					$('.trip-row[data-id='+id+']').remove();
				},
				error: function(err){
					alert(err);
				}
			})
			
		}
	});

/*--------------------------------------------------------------------
Get the search criterai from the website
And valid each of them, if they are valid, send to the server to corresponding functoin
If not valid, alert user to get correct data.
---------------------------------------------------------------------*/
	$('#findTrip').click(function(){
		var provider;
		provider = $('input[name=type]:checked',"#tripForm").val();
		var currentTime = new Date();
		var tempDate = $("#expectedDate").val().replace("T", " ") + " GMT-0500 (Eastern Standard Time)";
		var expectedDate = new Date(tempDate);
		var reg = /^\d+$/;
		var checkPrice = $('#expectedPrice').val();
		var searchDistance = $('#searchDistance').val();
		console.log(searchDistance);
		if (currentTime > expectedDate || expectedDate == null){
			//Check for date entered is after the time right now
			alert("Please Select a Date After RIGHT NOW!");
		}
		else if ($("#fromWhere").val() == '' || $("#toWhere").val() == ''){
			alert("Please Enter your From And To places");
		}
		else if(provider == null){
			alert("Please choose Trip Provider or Trip Wanted");
		}
		else if (checkPrice != ''){
			if (!reg.test(checkPrice)){
				alert("Please Input a NUMBER only or nothing for price");
			}
			else{
				if (!reg.test(searchDistance)){
					alert("Please Input a Number only or nothing for search offset");
				}
				else{
					updateTrip(provider,expectedDate);
				}
			}
		}
		else if (searchDistance != ''){
			if (!reg.test(searchDistance)){
				alert("Please Input a Number only or nothing for search offset");
			}
			else{
				updateTrip(provider,expectedDate);
			}			
		}
		else{
			updateTrip(provider,expectedDate);
		}
	});

/*--------------------------------------------------------------------
If click list of trip, search for the clicked item
---------------------------------------------------------------------*/
	$('.trip-row').click(function(){
	  var ids = $(this).data('id');
	  var url = "/searchTrip/" + ids;
	  window.location.href = url;
	});

/*--------------------------------------------------------------------
If click on one user row, go to the user's profile
---------------------------------------------------------------------*/
	$('.user-row').click(function(){
  		var id = $(this).data('id');
		window.location.href = "/users/"+id;
	});	

/*--------------------------------------------------------------------
Search user take in the keyword to searc
and return to the website of the searched resutl
---------------------------------------------------------------------*/
	$('#searchUser').click(function(){
		$.ajax({
			type: "GET",
			url: "/api/users/search/?keyword=" + $('#searchUserKeyword').val(),
			success: function(users){
				if(users.length>0){
					$('#userList').html(showUsers(users));
					$('.user-row').click(function(){
				  		var id = $(this).data('id');
				  		window.location.href = "/users/"+id;
					});	
				} else {
					$('#userList').html("<span>No user found. </span>");
				}
				
			},
			error: function(err){
				alert(err);
			}
		})
	});
});

/*----------------------------------------------------------------
Used to display htmls
-----------------------------------------------------------------*/
function showUsers(users){
	var html = "";
	for(i in users){
		html = html + "<tr class='user-row' data-id='"+users[i]._id+"''>";
		html = html + "<th>"+users[i].email+"</th>";
		html = html + "<th>"+users[i].displayName+"</th></tr>";	
	}
	return html;
}


//Helper function: Getting Lat Long Using Goolge API:
function updateTrip(provider,expectedDate){
	startAddress_plain = $("#fromWhere").val();
	endAddress_plain =  $("#toWhere").val();
	startAddress = ($("#fromWhere").val()).replace(/[ ,.\#]/g,"+");
	endAddress = ($("#toWhere").val()).replace(/[ ,.\#]/g,"+");
	var date = expectedDate;
	var latlng;
	var trip = {
		user: -1,
		startPoint: null,
		endPoint: null,
		date: date,
		price: $('#expectedPrice').val(),
		provider: provider,
		searchDistance: $('#searchDistance').val()
	};
	
	console.log(trip.searchDistance);
	$.ajax({
		type: "GET",
		url: "https://maps.googleapis.com/maps/api/geocode/json?address=" + startAddress + "&key=AIzaSyC9XO6VWQkwsUbXQi7WObMU1ekQFsIoKqk&language=en",
		success: function(data){
			if (data.status == "ZERO_RESULTS"){
				alert("Incorrect Address Entered");
			}
			else {
				var lat = Number(data.results[0].geometry.location.lat);
				var lng = Number(data.results[0].geometry.location.lng);
				latlng = {latitude: lat, longitude: lng, text: data.results[0].formatted_address};
				trip.startPoint = latlng;
				$.ajax({
					type: "GET",
					url: "https://maps.googleapis.com/maps/api/geocode/json?address=" + endAddress + "&key=AIzaSyC9XO6VWQkwsUbXQi7WObMU1ekQFsIoKqk&language=en",
					success: function(data){
						var lat = Number(data.results[0].geometry.location.lat);
						var lng = Number(data.results[0].geometry.location.lng);
						latlng = {latitude: lat, longitude: lng, text: data.results[0].formatted_address};
						trip.endPoint = latlng;
						$.ajax({
							type:"POST",
							url:"/api/updateTrip",
							data: trip,
							success: function(data){
								window.location.href ='/searchTrip/' + data;
							},
							error: function(){
								alert("Error in updateing Trip to the server");
							}
						});
					},
					error: function(){
						alert("Fail To Get Info about Address you have entered");
					}
				});
			}
		},
		error: function(){
			alert("Fail To Get Info about Address you have entered");
		}
	});
}