/*
var app = angular.module('userList', []);
app.controller('userListCtrl', function($scope, $http) {

  $scope.viewProfile = function(id){
    window.location.href = "/users/"+id;
  }

  $http.get("/api/userList")
    .success(function(response) {$scope.users = response;});
});
*/

$('.user-row').click(function(){
  var id = $(this).data('id');
  window.location.href = "/users/"+id;
})