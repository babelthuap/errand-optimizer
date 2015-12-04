var map;

$(document).ready(function() {

  var NUM_DESTINATIONS = $('.destination').length;
  var BAD_QUERY = false;
  var travelTimes;

  var geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json?';
  var apiKey = 'AIzaSyBKpcPHdC40SqI-bQoThXGU1YTKW3Xg-oY';

  // get current location
  var home;
  $('button').prop('disabled', true);
  $('#results .caption').text('Getting your current location...');
  navigator.geolocation.getCurrentPosition(function(pos) {
    var crd = pos.coords;
    home = crd.latitude.toFixed(7) + ',' + crd.longitude.toFixed(7);
    map = new google.maps.Map(document.getElementById('map'), {
      center: {
        lat: crd.latitude,
        lng: crd.longitude
      },
      zoom: 12
    });
    $('button').prop('disabled', false);
    $('#results .caption').empty();
  });

  // click listeners
  $('.find').click(centerOnAddress);
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
    if (!home) return;

    $('#findOptimal').prop('disabled', true)

    // create array of the destinations
    var dests = [];
    for (var i = 0; i < NUM_DESTINATIONS; i++) {
      var loc = $('#loc' + i).val();
      if (loc) { // don't bother with empty destinations
        dests.push(loc);
      }
    }

    // we won't calculate an optimal route for 0 or 1 destinations 
    if (dests.length < 2) {
      $('#findOptimal').prop('disabled', false);
      return;
    }

    // clear old results
    $('#results ol, #results a').empty();

    // make array of all pairs of nodes (including home)
    var pairs = allPairs(dests.concat([home]));

    // make array of all permutations of the nodes (a.k.a. destinations)
    // -- these represent all possible routes that visit all nodes (and start and end at home)
    var routes = allPerms(dests).map(function(route) {
      return [home].concat(route).concat([home]);
    })

    // get travel time between each pair of destinations
    travelTimes = {};
    pairs.forEach(function(pair, i) {
      calcTimeBetween(pair[0], pair[1]);
    });

    var waitToGetAllTimes = setInterval(function() {

      if (BAD_QUERY) {
        clearInterval(waitToGetAllTimes);
        alert('There was a problem resolving some of the Google Maps queries. Make sure all addresses are valid.');
        BAD_QUERY = false;
        $('#findOptimal').prop('disabled', false);
      }

      $('#results .caption').text('Queries resolved: ' + 
                                  Object.keys(travelTimes).length +
                                  ' of ' +
                                  pairs.length);

      if (Object.keys(travelTimes).length === pairs.length) {
        clearInterval(waitToGetAllTimes);

        // calculate time for each route        
        var totalTimes = routes.map(totalTimeOfRoute);

        // pick out fastest route
        var indexOfFastest = totalTimes.reduce(function(iOfMin, current, i) {
          return current < totalTimes[iOfMin] ? i : iOfMin;
        }, 0);

        // display the results
        $('#results .caption').text('Fastest Route (' +
                                    Math.round(totalTimes[indexOfFastest] / 60) +
                                    ' minutes total):');

        var $directions = [];
        routes[indexOfFastest].forEach(function(dest, i, arr) {
          if (i === 0 || i === arr.length - 1) dest = 'Your current location';
          $directions.push( $('<li>').text(dest) );
        });

        $('#results ol').append($directions);

        var directionsUrl = 'https://www.google.com/maps/dir/'
        routes[indexOfFastest].forEach(function(dest) {
          directionsUrl += dest.replace(/\s+/g, '+') + '/';
        });

        $('#results ol').after( $('<a>').text('view directions in Google Maps')
                                        .attr('href', directionsUrl)
                                        .attr('target', '_blank') );        

        $('#findOptimal').prop('disabled', false);
      }
    }, 100);

  }


  function totalTimeOfRoute(route) {
    return route.reduce(function(total, dest, i) {
      if (i === route.length - 1) return total;
      return total + travelTimes[dest + '->' + route[i + 1]];
    }, 0);
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
        travelTimes[loc1 + '->' + loc2] = time;
      } else if (status === 'OVER_QUERY_LIMIT' && !BAD_QUERY) {
        setTimeout(function() {
          calcTimeBetween(loc1, loc2);
        }, 250 + Math.floor(Math.random() * 750)); // wait 250+ ms before trying again
      } else {
        BAD_QUERY = true;
      }
    });
  }

})

function initMap() {}
