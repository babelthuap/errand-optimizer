var map;

$(document).ready(function() {

  var NUM_DESTINATIONS = $('.destination').length;

  // FOR TESTING PURPOSES
  var HOME = '46684 Windmill Dr';
  
  var geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json?';
  var apiKey = 'AIzaSyAkiQd6LbsShOKAG8vrR-YMF9dn3BQE9oE';


  $('.center').click(centerOnAddress);
  $('#findOptimal').click(findOptimal);

  function centerOnAddress() {
    var address = $(this).siblings('.address').val().replace(/\s+/g, '+');
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

  // THIS IS A BRUTE FORCE SOLUTION OF THE TRAVELING SALESMAN PROBLEM
  function findOptimal() {
    console.log('findOptimal');

    // create array of the destinations
    var dests = [];
    for (var i = 0; i < NUM_DESTINATIONS; i++) {
      var loc = $('#loc' + i).val();
      if (loc) { // don't bother with empty destinations
        dests.push( loc );
      }
    }

    // we won't calculate an optimal route with 0 or 1 destinations 
    if (dests.length < 2) return;

    console.log('dests:', dests);

    // create array of all pairs of destinations (order matters)
    var pairs = [];
    for (var i = 0; i < dests.length - 1; i++) {
      for (var j = i + 1; j < dests.length; j++) {
        pairs.push([ dests[i], dests[j] ]);
        pairs.push([ dests[j], dests[i] ]);
      }
    }

    console.log('pairs:', pairs)



    // calcTimeBetween($('#loc1').val(), $('#loc2').val());
  }


  // calculate time to travel between two locations
  function calcTimeBetween(loc1, loc2) {
    var directionsService = new google.maps.DirectionsService();

    var request = {
      origin: loc1,
      destination: loc2,
      travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, function(data, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        var time = data.routes[0].legs[0].duration.value;
        console.log('time between', loc1, 'and', loc2, '=', time);
      }
    });
  }

})

function initMap() {
  // CENTER ON USER'S LOCATION:
  // navigator.geolocation.getCurrentPosition(function(pos) {
  //   var crd = pos.coords;
  //   map = new google.maps.Map(document.getElementById('map'), {
  //     center: {
  //       lat: crd.latitude,
  //       lng: crd.longitude
  //     },
  //     zoom: 12
  //   });
  // });
}




























