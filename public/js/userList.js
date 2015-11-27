$('.user-row').click(function(){
  var id = $(this).data('id');
  window.location.href = "/users/"+id;
})

// function updateResultPanel(data) {
//     $("#resultPanel").html(data);
// }
// $(document).ready(function() {
//     $("#resultPanel").hide();
//     $(".glyphicon-envelope").click(function() {
//       $("#resultPanel").show();
//         $.ajax({
//             type: "GET",
//             datatype: "html",
//             url: "/api/users/:id/chat",
//             success: updateResultPanel
//         });
//     });
// });