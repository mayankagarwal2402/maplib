// MAPLIB library assumes the Google Maps API is being referenced on the page before referencing this library 

// global namespace
var maplib = maplib || {};

// MAPLIB container for commmon methods and properties
maplib = {
	geocoder: null,
	map: null,
	pin: undefined,
	marker: null,
	markers: [],
	polyline: '',
	polyOptions: {
	    strokeColor: '#FF5555',
	    strokeOpacity: 0.7,
	    strokeWeight: 5,
	    map: null
	},
	center: null,
	directions: [],
	directionsService: new google.maps.DirectionsService(),
	waypointMarkers: false,
	loopWaypoints: false,
	markerCluster: null,
	polygons: [],

	// maplib logs: log messages displayed with custom annotations
	log: function(msg) {
		console.info('MAPLIB: ' + msg);
	},

	// loads a map into specified div on the page
	// loadMap: function( mapDiv, arg1=null, arg2=null ) {
	loadMap: function( mapDiv ) {
		geocoder = new google.maps.Geocoder();
		// if( !arg1 && !arg2 ) {

		// }
		// else {

		// }
		var latlng = new google.maps.LatLng(28.6139391, 77.2090212);
		var mapOptions = {
			zoom: 11,
			center: latlng,
			mapTypeId: 'roadmap'
		}
		this.map = new google.maps.Map(document.getElementById(mapDiv), mapOptions);
	},

	resetMap: function() {
		var ml = this;
		setTimeout(function() {
			ml.fixGreyMap();
			if( ml.markers.length > 0 ) {
				ml.fitMarkers();
			}
		}, 300);
	},

	fixGreyMap: function() {
		ml = this;
		$(window).resize(function() {
		    ml.fixGreyMap();
		});
		google.maps.event.trigger(maplib.map, 'resize');
	},

	// Returns the Google LatLng Object of the given lat, lng pair
	getLatLngObject: function( lat, lng ) {
		return new google.maps.LatLng( parseFloat(lat), parseFloat(lng) );
	},

	// returns a new marker with specified latlng
	addMarker: function(lat, lng) {
		var latlng = new google.maps.LatLng(lat, lng);
		var marker = new google.maps.Marker({
			position: latlng,
			draggable: true
		});
		this.markers.push(marker);
		return marker;
	},

	// Sets the map on all markers in the array.
	setAllMap: function(map) {
		this.markers.forEach(function(marker){
			marker.setMap(map);
		});
	},

	// Removes the markers from the map, but keeps them in the array.
	hideMarkers: function() {
		this.setAllMap(null);
	},

	// Shows any markers currently in the array.
	showMarkers: function( optional_marker_arg ) {
		if( optional_marker_arg ) {
			optional_marker_arg.setMap(this.map);
		}
		else {
			this.setAllMap(this.map);
		}
	},

	// Deletes all markers in the array by removing references to them.
	deleteMarkers: function() {
		this.hideMarkers();
		this.markers = [];
	},

	// Fits all the markers on currently on the map into one view
	fitMarkers: function() {
		if( this.markers.length == 1 ) {
			this.map.setZoom(13);
			this.map.setCenter(this.markers[0].position);
		}
		else {
			var markerBounds = new google.maps.LatLngBounds();
			this.markers.forEach(function(marker){
				markerBounds.extend(marker.position);
			});
			this.map.fitBounds(markerBounds);
		}
	},

	// group markers
	groupMarkers: function() {
		this.markerCluster = new MarkerClusterer(this.map, this.markers);
	},

	// Gets a random colored pin url for marker image
	getNewPin: function( hexcolor ) {
		var hex = "";
		if( typeof hexcolor !== "undefined" ) {
			if(hexcolor.length == 7) {
				hex = hexcolor.substr(1);
			}
			else {
				hex = hexcolor;
			}
		}
		else {
		    for( var i = 1; i <= 6; i++ ){
		    	if( i%2 == 0 ) {
		    		hex += "0";
		    	}
		    	else {
		        	hex += "0123456789ABCDEF".charAt( Math.floor( ( Math.random()*16 ) ) );
		    	}
		    }
		}
		pinImage =  new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + hex);

		// icon = { 
		// 	url: pinImage,
		//     origin: new google.maps.Point(0,0), // origin
		//     anchor: new google.maps.Point(0, 0) // anchor
		// }
		// return icon;
		return pinImage;
	},

	// generates a random HEX color code string
	getRandomColor: function() {
		var letters = '0123456789ABCDEF'.split('');
		var color = '#';
		for (var i = 0; i < 6; i++ ) {
		    color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	},

	getInvertedColor: function(hexcolor) {
		var hex = "";
		var letters = '0123456789ABCDEF';
		if(hexcolor.length == 7 && hexcolor.charAt(0) == '#') {
			hex = '#'
			hexcolor = hexcolor.substr(1);
		}
		for(var i = 0; i < 6; i++) {
			ch = hexcolor.charAt(i);
			ch_invert = letters.charAt(15 - letters.indexOf(ch));
			hex += ch_invert;
		}
		return hex;
	},

	getPinSymbol: function(color, scale) {
	    return {
	        path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
	        fillColor: color || '#F56B60',
	        fillOpacity: 1,
	        strokeColor: '#000',
	        strokeWeight: 2,
	        scale: scale || 1,
	        labelOrigin: new google.maps.Point(0,-30)
		    // origin: new google.maps.Point(10,10), // origin
		    // anchor: new google.maps.Point(10,10) // anchor
	    };
	},

	// Generate a polyline joining all the markers in the order they were added
	generatePolyline: function() {
		this.polyline = new google.maps.Polyline(this.polyOptions);
		var path = this.polyline.getPath();
		this.markers.forEach(function(marker){
			path.push( marker.position );
		});
		this.showPolyline();
	},

	showPolyline: function() {
		if( this.polyline ) { this.polyline.setMap(this.map); }
	},

	showPolylines: function() {
		var self = this;
		self.directions.forEach( function(element, index) {
			element.setMap(self.map);
		});
	},

	hidePolyline: function() {
		if( this.polyline ) { this.polyline.setMap(null); }
	},

	hidePolylines: function() {
		if( this.polyline ) { this.polyline.setMap(null); }
		this.directions.forEach( function(element, index) {
			element.setMap(null);
		});
	},

	deletePolyline: function() {
		if( this.polyline ) { this.polyline.setMap(null); }
		this.polyline = '';
	},

	deletePolylines: function() {
		if( this.polyline ) { this.polyline.setMap(null); }
		this.polyline = '';
		this.directions.forEach( function(element, index) {
			element.setMap(null);
		});
		this.directions = [];
	},

	addToPolyline: function( marker, polyline ) {
		if( typeof polyline === "undefined") {
			polyline = new google.maps.Polyline(this.polyOptions);
	    	this.directions.push(polyline);
		}
		else {
			polyline = polyline;
		}
		var path = polyline.getPath();
		path.push( marker.position );
		// this.markers.forEach(function(marker){
		// });
		return polyline;
	},

	displayPolyline: function( polyline ) {
		var decodedPath = google.maps.geometry.encoding.decodePath(polyline);
	    var decodedLevels = decodeLevels(decodedPath);
	    var color = this.getRandomColor();
	    console.log(polyline);

	    line = new google.maps.Polyline({
	        path: decodedPath,
	        levels: decodedLevels,
	        strokeColor: color,
	        strokeOpacity: 1.0,
	        strokeWeight: 5
	    });

	    this.directions.push(line);


		line.setMap(this.map);
	    console.log(decodedPath);

	    function decodeLevels(decodedPath) {
			var decodedLevels = [];
			for (var i = 0; i < decodedPath.length ; ++i) {
			    decodedLevels.push('B');
			}
			console.log(decodedLevels);
			return decodedLevels;
		}
	},
	
	// kept on hold because return response is cannot be returned as it is an async call
	plotWaypointRoute: function( wayptsArray ) {
		var start = this.getLatLngObject( wayptsArray[0][0], wayptsArray[0][1] );
		for( var i = 1; i <= wayptsArray.length-2 ; i++ ) {
			var latlng = this.getLatLngObject( wayptsArray[i][0], wayptsArray[i][1] );
			wayptsArray.push({
				location: latlng,
				stopover: true
			});
		};
		var end = this.getLatLngObject( wayptsArray[(wayptsArray.length-1)][0], wayptsArray[(wayptsArray.length-1)][1] );
	},

	plotWaypointsPolyline: function( geoCodesArray ) {
		var self = this;
		if( !geoCodesArray || geoCodesArray.length <= 0 ) {
			geoCodesArray = this.markers.map(function(marker){
                var pos = marker.position;
                return pos;
			}); 
		}
		var start = geoCodesArray[0];
		waypts = [];
		for( var i = 1; i <= geoCodesArray.length-2 ; i++ ) {
			var latlng = geoCodesArray[i];
			waypts.push({
				location: latlng,
				stopover: true
			});
		};
		var end = geoCodesArray[geoCodesArray.length-1];

		var wayptOptions = {
			origin: start,
			destination: end,
			waypoints: waypts,
			optimizeWaypoints: true,
			travelMode: google.maps.TravelMode.DRIVING
		};
		var polylineOptions = {
	        strokeColor: this.getRandomColor(),
	        strokeOpacity: 1.0,
	        strokeWeight: 5,
		};
		var directionsDisplay =  new google.maps.DirectionsRenderer({
			polylineOptions: polylineOptions
		});
		var directionsService = this.directionsService || new google.maps.DirectionsService();
		directionsService.route( wayptOptions, function(response, status) {
			if (status === google.maps.DirectionsStatus.OK) {
				directionsDisplay.setDirections(response);
				var route = response.routes[0];
			}
		});
		this.directions.push(directionsDisplay);
		directionsDisplay.setOptions( { suppressMarkers: !self.waypointMarkers } );
		// directionsDisplay.setMap(this.map);
		return directionsDisplay;
	},


	showWaypointsMarkers: function() {
		var self = this;
		self.directions.forEach( function(element, index) {
			element.setMap(null);
			element.suppressMarkers = false;
			element.setMap(self.map);
		});
	},

	hideWaypointsMarkers: function() {
		var self = this;
		self.directions.forEach( function(element, index) {
			element.setMap(null);
			element.suppressMarkers = true;
			element.setMap(self.map);
		});
	},

	addPolygon: function( latlng_array, color ) {
		var polygonCoords = latlng_array;
		color = color || this.getRandomColor();
		var polygon = new google.maps.Polygon({
			paths: polygonCoords,
			strokeColor: color,
			strokeOpacity: 0.8,
			strokeWeight: 2,
			fillColor: color,
			fillOpacity: 0.45
		});
		polygon.setMap(maplib.map);
		this.polygons.push(polygon);
		return polygon;
	},

	deletePolygons: function() {
		this.polygons.forEach( function(element, index) {
			element.setMap(null);
		});
	}
}

// marker click event
// google.maps.event.addListener(this.marker,'click',function() {
// 	alert('asdfsdf');
// });