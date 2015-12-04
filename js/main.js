var map;

$(document).ready(function() {

  var NUM_DESTINATIONS = $('.destination').length;
  var OVER_QUERY_LIMIT = false;
  var travelTimes;

  var geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json?';
  var apiKey = 'AIzaSyBKpcPHdC40SqI-bQoThXGU1YTKW3Xg-oY';

  // FOR TESTING PURPOSES
  // var HOME = '46684 Windmill Dr';

  // get current location
  var home;
  $('button').prop('disabled', true);
  $('#results .caption').text('Getting your current location...');
  navigator.geolocation.getCurrentPosition(function(pos) {
    home = pos.coords.latitude.toFixed(7) + ',' + pos.coords.longitude.toFixed(7);
    console.log('home:', home);
    $('button').prop('disabled', false);
    $('#results .caption').empty();
  });

  $('.find').click(centerOnAddress);
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

    $('#findOptimal').prop('disabled', true)

    // create array of the destinations
    var dests = [];
    for (var i = 0; i < NUM_DESTINATIONS; i++) {
      var loc = $('#loc' + i).val();
      if (loc) { // don't bother with empty destinations
        dests.push( loc );
      }
    }

    // we won't calculate an optimal route for 0 or 1 destinations 
    if (dests.length < 2) {
      $('#findOptimal').prop('disabled', false);
      return;
    }

    // let the user that the program is working
    $('#results .caption').text('Be patient! This takes a few seconds.');
    $('#results ol, #results a').empty();

    // make array of all pairs of nodes (including home)
    var pairs = allPairs(dests.concat([home]));

    // make array of all permutations of the nodes (a.k.a. destinations)
    // -- these represent all possible routes that visit all nodes (and start and end at home)
    var routes = allPerms(dests).map(function(route) {
      return [home].concat(route).concat([home]);
    })


    console.log('dests:', dests);
    console.log('pairs:', pairs);
    console.log('routes:', routes);

    // to ensure we don't hit the query limit, spread out the queries
    var interval = 0;
    if (pairs.length > 6) interval += 200;
    if (pairs.length > 12) interval += 400;

    // get travel time between each pair of destinations
    travelTimes = {};
    pairs.forEach(function(pair, i) {
      // stagger queries -- THIS IS A SILLY KLUDGE
      setTimeout(function() {
        calcTimeBetween(pair[0], pair[1]);
      }, i * interval)
    });

    var i = 0;
    var waitToGetAllTimes = setInterval(function() {
      console.log(++i);

      if (OVER_QUERY_LIMIT) {
        clearInterval(waitToGetAllTimes);
        alert('OVER QUERY LIMIT (try again in a few seconds)');
        OVER_QUERY_LIMIT = false;
        $('#findOptimal').prop('disabled', false);
      }

      if (Object.keys(travelTimes).length === pairs.length) {
        clearInterval(waitToGetAllTimes);
        console.log('travelTimes:', travelTimes);

        // calculate time for each route        
        var totalTimes = routes.map(totalTimeOfRoute);
        console.log('totalTimes:', totalTimes);

        // pick out fastest route
        var indexOfFastest = totalTimes.reduce(function(iOfMin, current, i) {
          return current < totalTimes[iOfMin] ? i : iOfMin;
        }, 0);

        console.log('indexOfFastest:', indexOfFastest);
        console.log('fastestRoute:', routes[indexOfFastest], totalTimeOfRoute(routes[indexOfFastest]));

        
        // display the results
        $('#results .caption').text('Fastest Route (' +
                                    Math.round(totalTimes[indexOfFastest] / 60) +
                                    ' minutes total):');

        var $directions = [];
        routes[indexOfFastest].forEach(function(dest, i, arr) {
          if (i === 0 || i === arr.length - 1) dest = 'Your current Location';
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
    }, interval + 10);

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
      // console.log(loc1, loc2, data);

      if (status == google.maps.DirectionsStatus.OK) {
        var time = data.routes[0].legs[0].duration.value;
        travelTimes[loc1 + '->' + loc2] = time;
      } else {
        OVER_QUERY_LIMIT = true;
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




























