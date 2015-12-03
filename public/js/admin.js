$(document).ready(function(){
	console.log('admin')
	console.log($('.delete-feedback'))

	$('.feedback-row').click(function(){
		var id = $(this).data('receiver');
		window.location.href = "/users/" + id;
	})

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