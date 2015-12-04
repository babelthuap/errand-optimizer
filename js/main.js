var map;

$(document).ready(function() {

  var NUM_DESTINATIONS = $('.destination').length;
  var travelTimes;

  var geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json?';
  var apiKey = 'AIzaSyBKpcPHdC40SqI-bQoThXGU1YTKW3Xg-oY';

  // FOR TESTING PURPOSES
  // var HOME = '46684 Windmill Dr';

  // get current location
  var home;
  navigator.geolocation.getCurrentPosition(function(pos) {
    home = pos.coords.latitude.toFixed(7) + ',' + pos.coords.longitude.toFixed(7);
    console.log('home:', home);
  });

  $('.center').click(centerOnAddress);
  $('#findOptimal').click(findOptimal);

  function centerOnAddress() {
    var address = $(this).siblings('.address').val().replace(/\s+/g, '+');

    $.get(geocodeUrl + 'key=' + apiKey + '&address=' + address)
      .done(function(data) {
        console.log('data:', data);
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
    if (!home) return;

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

    // make array of all pairs of nodes (including home)
    var pairs = allPairs(dests.concat([home]));

    // make array of all permutations of the destinations
    var perms = allPerms(dests);

    console.log('dests:', dests);
    console.log('pairs:', pairs);
    console.log('perms:', perms);

    // get travel time between each pair of destinations
    // travelTimes = {};
    // pairs.forEach(function(pair) {
    //   calcTimeBetween(pair[0], pair[1]);
    // });





    // calcTimeBetween($('#loc1').val(), $('#loc2').val());
  }


  // generate all length-2 subsets of an array (order matters)
  function allPairs(arr) {
    var pairs = [];
    for (var i = 0; i < arr.length - 1; i++) {
      for (var j = i + 1; j < arr.length; j++) {
        pairs.push([ arr[i], arr[j] ]);
        pairs.push([ arr[j], arr[i] ]);
      }
    }
    return pairs;
  }

  // generate all permutations of an array
  function allPerms(arr) {
    if (arr.length === 1) return [arr];
    var perms = [];
    for (var i = 0; i < arr.length; i++) {
      var elem = [arr[i]];
      var permsOnElem = [];
      var rest = arr.slice(0, i).concat(arr.slice(i + 1));
      allPerms(rest).forEach(function(perm) {
        permsOnElem.push( elem.concat(perm) );
      });
      perms = perms.concat(permsOnElem);
    }
    return perms;
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




























