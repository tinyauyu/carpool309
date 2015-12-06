$(document).ready(function(){
	console.log('admin')
	console.log($('.delete-feedback'))

	/*--------------------------------------------------------------
	If feedback-row clicked go to check the receiver's user profile
	---------------------------------------------------------------*/
	$('.feedback-row').click(function(){
		var id = $(this).data('receiver');
		window.location.href = "/users/" + id;
	})

	/*--------------------------------------------------------------
	Delete feedback and ask for comfirmantions
	---------------------------------------------------------------*/
	$('.delete-feedback').click(function(){
		var id = $(this).data('id');
		//alert(id);
		var c = confirm("Are you sure to delete this review (#"+id+")?");
		if(c){
			$.ajax({
				type: "DELETE",
				url: "/api/feedbacks/" + id,
				success: function(){
					$('.feedback-row[data-id='+id+']').parent().remove();
				},
				error: function(err){
					alert(err);
				}
			})
		}
	})

	/*--------------------------------------------------------------
	Delete certain trip and ask for confirmations
	---------------------------------------------------------------*/
	$('.delete-trip').click(function(){
		var id = $(this).parent().parent().data('id');
		//alert(id);
		var c = confirm("Are you sure to delete this trip (#"+id+")?");
		if(c){
			$.ajax({
				type: "DELETE",
				url: "/api/trips/" + id,
				success: function(){
					$('.trip-row[data-id='+id+']').parent().remove();
				},
				error: function(err){
					alert(err);
				}
			})
			
		}
	})

	/*
		var id = $(this).data('id');
		var c = confirm("Are you sure to delete this review (#"+id+")?");
		if(c){
			$.ajax({
				type: "DELETE",
				url: "/api/feedbacks/" + id,
				success: function(){
					$('.feedback-row[data-id='+id+']').parent().remove();
				},
				error: function(err){
					alert(err);
				}
			})
		}
	*/
})