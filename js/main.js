var map;

$(document).ready(function() {

  console.log('jQuery working')
  
  var geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json?';
  var directionsUrl = 'https://maps.googleapis.com/maps/api/directions/json?';
  var apiKey = 'AIzaSyBNRDTGtLXHjQHOGmXviTCtmLSw2Qn6SPU';

  $('#go').click(centerOnAddress);
  $('#address').on('keypress', function(e) {
    if (e.keyCode === 13) centerOnAddress();
  })

  $('#CALC').click(calcTime);

  function calcTime() {
    var loc1 = $('#loc1').val().replace(/\s+/g, '+');
    var loc2 = $('#loc2').val().replace(/\s+/g, '+');

    $.get(directionsUrl + 'key=' + apiKey + '&origin=' + loc1 + '&destination=' + loc2)
    .done(function(data) {
      console.log('directions:', data);

      $('#time').text( data.routes[0].legs.duration.value );
    })
  }






  function centerOnAddress() {
    var address = $('#address').val().replace(/\s+/g, '+');
    $.get(geocodeUrl + 'key=' + apiKey + '&address=' + address)
      .done(function(data) {
        if (data.results.length === 0) return; // if it found no matches
        var location = data.results[0].geometry.location;
        map = new google.maps.Map(document.getElementById('map'), {
          center: location,
          zoom: 12,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        });
      })
      .fail(function(err) {
        console.log('ERROR FETCHING GEOCODE INFO:', err)
      })
  }

})

function initMap() {
}

// DEFAULT:
// map = new google.maps.Map(document.getElementById('map'), {
//   center: {
//     lat: 44.92328498029149,
//     lng: -93.1558840197085
//   },
//   zoom: 12
// });

// CENTER ON USER'S LOCATION:
// navigator.geolocation.getCurrentPosition(function(pos) {
//   console.log('position:', pos);
//   var crd = pos.coords;
//   map = new google.maps.Map(document.getElementById('map'), {
//     center: {
//       lat: crd.latitude,
//       lng: crd.longitude
//     },
//     zoom: 10
//   });
// });
