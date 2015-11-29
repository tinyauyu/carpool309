$('.user-row').click(function(){
  var id = $(this).data('id');
  window.location.href = "/users/"+id;
})
