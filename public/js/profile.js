var profilePicBuffer = undefined;

function updateResultPanel(data) {
    $("#resultPanel").html(data.window);
    $("#resultPanel").attr('sendto', data.user.email);
    $.ajax({
      type: "GET",
      url: "/api/users/"+data.user._id+"/profilePic",
      success: function(img){
        $('#receiverImg').attr("src", img);
          },
      error: function(jqxhr, textStatus, errorThrown){
        alert(errorThrown);
      }
    });
}
$(document).ready(function() {
    $("#chat").click(function() {
      $("#chat").attr("disabled", true);
      $("#resultPanel").removeClass("hidden");
      var email = $("#chat").attr("receiver");
        $.ajax({
            type: "GET",
            datatype: "html",
            url: "/api/users/" + email + "/chatWindow",
            success: showChatWindow
        });
    });
})


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
      if(!$('#oldPassword').prop('disabled')){
        showPasswordInfo("danger","Please enter the original password!");
        return;
      }
    }

    if($('#newPassword').val()==""){
      showPasswordInfo("danger","Please fill in a new password!");
      return;
    }

    var profile = {
      _id: $('#profile').data('value'),
      password:{
        plain: $('#newPassword').val(),
        old: $('#oldPassword').val(),
        enabled: !$('#oldPassword').prop('disabled')
      }
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

  //button to add comment

  $(".starrr").starrr()


  var ratingsField = $('#ratings-hidden');
  $('.starrr').on('starrr:change', function(e, value){
    ratingsField.val(value);
  });

  $('#save').click(function(){
    var comment =  $("textarea[name='comment']").val();
    var star = ratingsField.val();
    var date = new Date();
    date = date.toString();
    //console.log(date.toString());
    //console.log(" star: "+star);
    if(!star){
      star = 0;
      //alert(star);
    }
    var feedback = {'comment': comment, 'rating': star, 'sender':'',
    'receiver': '', 'date': date};
    var profile_id = $('#profile').data('value');
    var currentUser = $('#profilePic_buffer').data('id');
    //alert(comment +'  s: ' +star);
    $.ajax({
      type: 'POST',
      url: "/api/users/" + profile_id + "/feedbacks",
      data: {json: JSON.stringify(feedback)},
      success: function(data){
        var curPage = $('#curPage').html();
        if(!curPage){
          curPage = 1;
        }
        displayComments($('#profile').data('value'),curPage);
      },
      error: function(jqxhr, textStatus, errorThrown){
        alert(errorThrown);
        //$(".editableform-loading").addClass('hidden');
      }
    });
  });
  //control the page number buttons
  $('#pageNumbers').on('click','button',function(event){
    var page = event.target.innerHTML;
    displayComments($('#profile').data('value'), page);
  });
  displayComments($('#profile').data('value'),1);
});

$.fn.editable.defaults.mode = 'inline';

var commentsPerPage = 3;
//display comments and rating
function displayComments(profile_id, pageNumber){
  //console.log($('#sortable').html());
  //display average rating
  var request = $.ajax({
    type: 'GET',
    url: '/api/users/' + profile_id,
    async: true,
    success: function(user){
      $('#averageRating').html(user.averageRating.toFixed(2));
      $('#numberOfRating').html(user.numberOfRating);
      var stars = "";
      var intRating = Math.round( user.averageRating );
      for(var i = 0; i < intRating; i++){
        stars += '<span class="glyphicon glyphicon-star"></span>';
      }
      var emptystar = 5 - intRating;
      for(var i = 0; i < emptystar; i++){
        stars +='<span class="glyphicon glyphicon-star-empty"></span>';
      }
      $('#averageStars').html(stars);
      //console.log("fivestars: " + user.fiveStars +" asd "+ user.fiveStars / user.numberOfRating);
      var fiveStars = (user.fiveStars/user.numberOfRating * 100).toFixed(1);
      var fourStars = (user.fourStars/user.numberOfRating * 100).toFixed(1);
      var threeStars = (user.threeStars/user.numberOfRating * 100).toFixed(1);
      var twoStars = (user.twoStars/user.numberOfRating * 100).toFixed(1);
      var oneStars = (user.oneStars/user.numberOfRating * 100).toFixed(1);
      $('#fiveStars').attr( "style", "width:"+fiveStars+"%");
      $('#fourStars').attr( "style", "width:"+fourStars+"%");
      $('#threeStars').attr( "style", "width:"+threeStars+"%");
      $('#twoStars').attr( "style", "width:"+twoStars+"%");
      $('#oneStars').attr( "style", "width:"+oneStars+"%");
      $('#fiveStarsTxt').html(fiveStars+"%");
      $('#fourStarsTxt').html(fourStars+"%");
      $('#threeStarsTxt').html(threeStars+"%");
      $('#twoStarsTxt').html(twoStars+"%");
      $('#oneStarsTxt').html(oneStars+"%");
    },
    error: function(jqxhr, textStatus, errorThrown){
      alert(errorThrown);
    }
  });
  $.ajax({
    type: 'GET',
    url: "/api/users/" + profile_id + "/feedbacks",
    success: function(data){
      var list = "";
      var pages = Math.ceil(data.length/commentsPerPage);
      var buttons = "";
      for (i =1; i <= pages; i++){
        if(i == pageNumber){
          buttons+="<label id='curPage' class='btn btn-primary btn-default'>"+i.toString() +"</label>"
        }
        else{
          buttons += "<button class ='btn'>"+i.toString()+"</button>"
        }
      }
      $('#pageNumbers').html(buttons);
      for(i = commentsPerPage*(pageNumber-1);
        i < Math.min(data.length,commentsPerPage*pageNumber);
        i++){
            var info = data[i];
            if(info.sender.displayName == ""){
              info.sender.displayName = info.sender.email;
            }
            list+='<div class="feedback-row" data-id="'+info._id+'">';
            list+='<li class="ui-state-default">"' + info.comment + '"</li>';
            list+='<small class="pull-right text-muted">' +
              '<small><a href="/users/'+info.sender._id+'">' +
              info.sender.displayName + '</a></small><br>' +
              '<small>rating: ' + info.rating + '/5 </small><br>'+
              '<span class="glyphicon glyphicon-time"></span>'
              +info.date + '</small>';
            list += '<br><br>';
            //list += '<small>rating: ' + info.rating + '/5 </small><br>'
            list +='<br>';
            list+='</div>';
            console.log('hihihi ' + list);
            $('#sortable').html(list);

            addDeleteBtn(info.sender._id, info._id, function(isAuth, id){
              if(isAuth){
                console.log($('.feedback-row[data-id='+id+']'));
                $('.feedback-row[data-id='+id+']').prepend(
                  '<button type="button" class="delete-feedback close" data-id="'+
                info._id+
                '" aria-label="Close"><span aria-hidden="true">&times;</span></button>');
              }
              $('.delete-feedback[data-id='+id+']').click(function(){
                var id = $(this).data('id');
                //alert(id);
                var c = confirm("Are you sure to delete this review (#"+id+")?");
                if(c){
                  $.ajax({
                    type: "DELETE",
                    url: "/api/feedbacks/" + id,
                    success: function(){
                      $('.feedback-row[data-id='+id+']').parent().remove();
                      location.reload();
                    },
                    error: function(err){
                      alert(err);
                    }
                  })
                }
              })
            });
      }

    },

    error: function(jqxhr, textStatus, errorThrown){
      alert(errorThrown);
    }
  });
}

//for the star rating user click
var __slice = [].slice;
(function(e, t) {
    var n;
    n = function() {
        function t(t, n) {
            var r, i, s, o = this;
            this.options = e.extend({}, this.defaults, n);
            this.$el = t;
            s = this.defaults;
            for (r in s) {
                i = s[r];
                if (this.$el.data(r) != null) {
                    this.options[r] = this.$el.data(r)
                }
            }
            this.createStars();
            this.syncRating();
            this.$el.on("mouseover.starrr", "span", function(e) {
                return o.syncRating(o.$el.find("span").index(e.currentTarget) + 1)
            });
            this.$el.on("mouseout.starrr", function() {
                return o.syncRating()
            });
            this.$el.on("click.starrr", "span", function(e) {
                return o.setRating(o.$el.find("span").index(e.currentTarget) + 1)
            });
            this.$el.on("starrr:change", this.options.change)
        }
        t.prototype.defaults = {
            rating: void 0,
            numStars: 5,
            change: function(e, t) {}
        };
        t.prototype.createStars = function() {
            var e, t, n;
            n = [];
            for (e = 1, t = this.options.numStars; 1 <= t ? e <= t : e >= t; 1 <= t ? e++ : e--) {
                n.push(this.$el.append("<span class='glyphicon .glyphicon-star-empty'></span>"))
            }
            return n
        };
        t.prototype.setRating = function(e) {
            if (this.options.rating === e) {
                e = void 0
            }
            this.options.rating = e;
            this.syncRating();
            return this.$el.trigger("starrr:change", e)
        };
        t.prototype.syncRating = function(e) {
            var t, n, r, i;
            e || (e = this.options.rating);
            if (e) {
                for (t = n = 0, i = e - 1; 0 <= i ? n <= i : n >= i; t = 0 <= i ? ++n : --n) {
                    this.$el.find("span").eq(t).removeClass("glyphicon-star-empty").addClass("glyphicon-star")
                }
            }
            if (e && e < 5) {
                for (t = r = e; e <= 4 ? r <= 4 : r >= 4; t = e <= 4 ? ++r : --r) {
                    this.$el.find("span").eq(t).removeClass("glyphicon-star").addClass("glyphicon-star-empty")
                }
            }
            if (!e) {
                return this.$el.find("span").removeClass("glyphicon-star").addClass("glyphicon-star-empty")
            }
        };
        return t
    }();
    return e.fn.extend({
        starrr: function() {
            var t, r;
            r = arguments[0], t = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
            return this.each(function() {
                var i;
                i = e(this).data("star-rating");
                if (!i) {
                    e(this).data("star-rating", i = new n(e(this), r))
                }
                if (typeof r === "string") {
                    return i[r].apply(i, t)
                }
            })
        }
    })
})(window.jQuery, window);

function addDeleteBtn(senderId, feedbackId, callback){
  $.ajax({
      type: 'GET',
      url: "/api/users/current",
      success: function(data){
        console.log(data.userType);
        console.log(data._id);
        if(data.userType>=1){
          callback(true,feedbackId);
        } else if (data._id==senderId){
          callback(true,feedbackId);
        } else {
          //callback(false);
        }
      },
      error: function(jqxhr, textStatus, errorThrown){
        //callback(false);
      }
    });
}
