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
    var feedback = {'comment': comment, 'rating': star, 'sender':'',
    'receiver': '', 'date': date};
    var profile_id = $('#profile').data('value');
    //alert(comment +'  s: ' +star);
    $.ajax({
      type: 'POST',
      url: "/api/users/" + profile_id + "/feedbacks",
      data: {json: JSON.stringify(feedback)},
      success: function(data){
        //$(".editableform-loading").addClass('hidden');
        //alert(data);
        //window.location.reload();
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
    //var page = event.target;
    var page = event.target.innerHTML;
    displayComments($('#profile').data('value'), page);
  });
  displayComments($('#profile').data('value'),1);

});

$.fn.editable.defaults.mode = 'inline';

var commentsPerPage = 3;
function displayComments(profile_id, pageNumber){
  //console.log($('#sortable').html());

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
      for(i = commentsPerPage*(pageNumber-1); i < Math.min(data.length,commentsPerPage*pageNumber); i++){
        var info = data[i];
        var senderId = info.sender;
        var comment = info.comment;
        var request = $.ajax({
          type: 'GET',
          url: '/api/users/' + senderId,
          async: false,
          success: function(user){
            list+='<p class="pull-left primary-font margin-left">' + user.displayName + '</p><br>';
            list+='<small class="pull-right text-muted">' +
              '<small>rating: ' + info.rating + '/5 </small><br>'+
              '<span class="glyphicon glyphicon-time"></span>'
              +info.date + '</small>';
            list += '<br><br>';
            //list += '<small>rating: ' + info.rating + '/5 </small><br>'
            list += '<li class="ui-state-default">' + comment + '</li>';
            list +='<br>';

          },
          error: function(jqxhr, textStatus, errorThrown){
            alert(errorThrown);
          }
        });
      }
      $('#sortable').html(list);
    },
    error: function(jqxhr, textStatus, errorThrown){
      alert(errorThrown);
    }
  });
    /*<strong class="pull-left primary-font">James</strong>
    <small class="pull-right text-muted">
       <span class="glyphicon glyphicon-time"></span>7 mins ago</small>
    </br>
    <li class="ui-state-default">Lorem ipsum dolor </li>
    </br>

    var list = "<strong>" + $( "p" ).length + " paragraphs!</em>";
    return "<p>All new content for " + emphasis + "</p>";*/

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
