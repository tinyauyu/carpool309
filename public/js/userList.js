$(document).ready(function(){
	$('.user-row').click(function(){
  		var id = $(this).data('id');
  		window.location.href = "/users/"+id;
	});

	$('#findTrip').click(function(){
		var provider;
		provider = $('input[name=type]:checked',"#tripForm").val();
		var currentTime = new Date();
		var tempDate = $("#expectedDate").val().replace("T", " ") + " GMT-0500 (Eastern Standard Time)";
		var expectedDate = new Date(tempDate);
		if (currentTime > expectedDate || expectedDate == null){
			//Check for date entered is after the time right now
			alert("Please Select a Date After RIGHT NOW!");
		}
		else if ($("#fromWhere").val() == '' || $("#toWhere").val() == ''){
			alert("Please Enter your From And To places");
		}
		else if(provider == null){
			alert("Please choose Trip Provider or Trip Wanted")
		}
		else{
			updateTrip(provider,expectedDate);
		}
	});

	/*$('#searchFor').click(function(){
		if ($('searchFor').val() == ''){
			alert("Nothing to Serach For");
		}
		else {
			console.log("I am here to search");
		}
	});*/
});

//Helper function: Getting Lat Long Using Goolge API:
function updateTrip(provider,expectedDate){
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
	};

	$.ajax({
		type: "GET",
		url: "https://maps.googleapis.com/maps/api/geocode/json?address=" + startAddress + "&key=AIzaSyC9XO6VWQkwsUbXQi7WObMU1ekQFsIoKqk",
		success: function(data){
			if (data.status == "ZERO_RESULTS"){
				alert("Incorrect Address Entered");
			}
			else {
				var lat = Number(data.results[0].geometry.location.lat);
				var lng = Number(data.results[0].geometry.location.lng);
				latlng = {latitude: lat, longitude: lng};
				trip.startPoint = latlng;
				$.ajax({
					type: "GET",
					url: "https://maps.googleapis.com/maps/api/geocode/json?address=" + endAddress + "&key=AIzaSyC9XO6VWQkwsUbXQi7WObMU1ekQFsIoKqk",
					success: function(data){
						var lat = Number(data.results[0].geometry.location.lat);
						var lng = Number(data.results[0].geometry.location.lng);
						latlng = {latitude: lat, longitude: lng};
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