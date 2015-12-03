var map, map2;
function initMap() {
  var data = $('#fromWhere').data('info');
  data = data.split(",");
  var from = {lat: Number(data[0]), lng: Number(data[1])};
  var to = {lat: Number(data[2]), lng: Number(data[3])};
  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 6,
    center: from
  });

  var markerFrom = new google.maps.Marker({
    position: from,
    map: map,
    title: 'From',
  });

  var markerTo = new google.maps.Marker({
    position: to,
    map: map,
    title: 'To',
  });

  var lineSymbol = {
    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
  };

  // Create the polyline and add the symbol via the 'icons' property.
  var line = new google.maps.Polyline({
    path: [from, to],
    icons: [{
      icon: lineSymbol,
      offset: '100%'
    }],
    map: map
  });

  data = $('#fromUserWhere').data('info');
  data = data.split(",");
  from = {lat: Number(data[0]), lng: Number(data[1])};
  to = {lat: Number(data[2]), lng: Number(data[3])};
  var map2 = new google.maps.Map(document.getElementById('map2'), {
    zoom: 6,
    center: from
  });

  var markerFrom = new google.maps.Marker({
    position: from,
    map: map2,
    title: 'From',
  });

  var markerTo = new google.maps.Marker({
    position: to,
    map: map2,
    title: 'To',
  });

  var lineSymbol = {
    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
  };

  // Create the polyline and add the symbol via the 'icons' property.
  var line = new google.maps.Polyline({
    path: [from, to],
    icons: [{
      icon: lineSymbol,
      offset: '100%'
    }],
    map: map2
  });
}