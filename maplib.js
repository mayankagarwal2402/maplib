// MAPLIB library assumes the Google Maps API is being referenced on the page before referencing this library 
passLatLngObject = function(func) {
	console.log(arguments);
	if(arguments.length < 1 || arguments.length > 2) {
		this.log('Please enter a valid Geo-Coordinate.')
	}
	else if( arguments.length == 2 ) {
		var lat = arguments[0]
		var lng = arguments[1]
	}
	else {
		var arg = arguments[0]
		if( Array.isArray(arg) == true ) {
			var lat = arg[0]
			var lng = arg[1]
		}
		else if( typeof arg === 'object' ) {
			var lat = arg.lat
			var lng = arg.lng
		}
	}

	return function() {
		var latlng = new google.maps.LatLng( parseFloat(lat), parseFloat(lng) )
		return func.apply(this, latlng)
	}
}

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
	center: google.maps.LatLng(28.6139391, 77.2090212),
	directions: [],
	directionsService: new google.maps.DirectionsService(),
	waypointMarkers: false,
	loopWaypoints: false,
	markerCluster: null,
	polygons: [],
	heatmap: null,

	// maplib logs: log messages displayed with custom annotations
	log: function(msg) {
		console.info('MAPLIB: ' + msg)
	},

	dbg: function(msg, obj) {
		if(!obj) {
			obj = msg
			msg = '' 
		}
		console.info( ('MAPLIB: ' + msg), obj )
	},

	// loads a map into specified div on the page
	// loadMap: function( mapDiv, arg1=null, arg2=null ) {
		// if( !arg1 && !arg2 ) {}
		// else {}
	loadMap: function( mapDiv, options ) {
		var mapOptions = {
			zoom: 13,
			center: this.center,
			mapTypeId: 'roadmap',
		}

		if(options) {
			if(options.theme == 'dark') {
				mapOptions.styles = [{"featureType":"all","elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#000000"},{"lightness":40}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#000000"},{"lightness":16}]},{"featureType":"all","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":17},{"weight":1.2}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":21}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":16}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":19}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":17}]}] 
			}
			else if(options.theme != 'light') {
				this.log('No theme named \''+options.theme+'\'. Defaulted to \'light\'')
			}
			if(options.center) {
				this.center = getLatLngObject( center.lat, center.lng )
				mapOptions.center = this.center
			}
		}

		if( typeof mapDiv === "string" ) {
			mapDiv_obj = document.getElementById(mapDiv)
		}
		else {
			mapDiv_obj = mapDiv	
		}

		this.map = new google.maps.Map(mapDiv_obj, mapOptions);
		return this.map
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

	getGeocode: function(address, callback) {
		this.geocoder = this.geocoder || new google.maps.Geocoder();
		maplib.geocoder.geocode({'address': address}, function(results, status) {
			if (status === 'OK') {
				var loc = results[0].geometry.location
				var lat = results[0].geometry.location.lat()
				var lng = results[0].geometry.location.lng()
				callback(lat, lng)
			}
			else {
				console.warn('Geocode was not successful for the following reason: ' + status)
			}
		})
	},

	// Returns the Google LatLng Object of the given lat, lng pair
	// getLatLngObject: passLatLngObject(this.__getLatLngObject),
	// __getLatLngObject: function( latlng ) {
	getLatLngObject: function( lat, lng ) {
		var latlng = new google.maps.LatLng( parseFloat(lat), parseFloat(lng) );
		return latlng
	},

	getLatLng: function(marker_or_location) {
		if( marker_or_location.getPosition ) {
			var position = marker_or_location.getPosition()
		}
		else {
			var position = marker_or_location
		}
		return {
			'lat': position.lat(),
			'lng': position.lng(),
		}
	},

	// returns a new marker with specified latlng
	// addMarker: passLatLngObject(this.__addMarker),
	// __addMarker: function(latlng) {
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
		this.markers.forEach(function(marker) {
			marker.setMap(map);
		});
	},

	// Shows any markers currently in the array.
	showMarkers: function( markers ) {
		if( typeof markers === "undefined" ) {
			markers = this.markers
		}

		if( markers instanceof Array ) {
			markers.forEach( function(marker) {
				marker.setMap(maplib.map)
				marker.setVisible(true)
			});
		}
		else {
			var marker = markers
			marker.setMap(this.map)
			marker.setVisible(true)
		}
	},

	// Removes the markers from the map, but keeps them in the array.
	hideMarkers: function(markers) {
		if( typeof markers === "undefined" ) {
			markers = this.markers
		}

		if( markers instanceof Array ) {
			markers.forEach( function(marker) {
				marker.setMap(null);
				marker.setVisible(false);;
			});
		}
		else {
			markers.setMap(null);
			marker.setVisible(false);;
		}
	},

	// Deletes all markers in the array by removing references to them.
	deleteMarkers: function(markers) {
		if( typeof markers === "undefined" ) {
			markers = this.markers
			this.markers = []
		}
		if( markers instanceof Array ) {
			markers.forEach( function(marker) {
				marker.setMap(null);
				maplib.markers.splice( maplib.markers.indexOf(marker), 1 )
			});
		}
		else {
			markers.setMap(null);
			this.markers.splice( this.markers.indexOf(markers), 1 )
		}
	},

	// Fits all the markers on currently on the map into one view
	fitMarkers: function(markers) {
		if( typeof markers === "undefined" ) {
			markers = this.markers
		}
		
		if( !(markers instanceof Array) || (this.markers.length == 1) ) {
			this.map.setZoom(13);
			this.map.setCenter(this.markers[0].position);
		}
		else {
			var markerBounds = new google.maps.LatLngBounds();
			markers.forEach(function(marker) {
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
	generatePolyline: function(markers, color) {
		this.polyOptions.strokeColor = color || this.polyOptions.strokeColor
		
		var polyline = new google.maps.Polyline(this.polyOptions);
		var path = polyline.getPath();
		
		if( typeof markers === "undefined" ) {
			markers = this.markers
		}
		markers.forEach(function(marker){
			path.push( marker.position );
		});
		
		this.polyline = polyline 
		this.directions.push( polyline )
		this.showPolyline( polyline );
		
		return polyline
	},

	getPolyString(polyline) {
		var string = google.maps.geometry.encoding.encodePath( polyline.getPath() );
		return string
	},

	showPolyline: function(polyline) {
		var polyline = polyline || this.polyline
		if( polyline ) { polyline.setMap(this.map); }
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

	displayPolyline: function( polystring, color ) {
	    function decodeLevels(decodedPath) {
			var decodedLevels = [];
			for (var i = 0; i < decodedPath.length ; ++i) {
			    decodedLevels.push('B');
			}
			return decodedLevels;
		}

		var decodedPath = google.maps.geometry.encoding.decodePath(polystring);
		var decodedLevels = decodeLevels(decodedPath);

	    polyline = new google.maps.Polyline({
	        path: decodedPath,
	        levels: decodedLevels,
	        strokeColor: color || this.getRandomColor(),
	        strokeOpacity: 1.0,
	        strokeWeight: 5
	    });

	    this.directions.push(polyline);
		polyline.setMap(this.map);
		return polyline
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
	},

	clusterize: function(markers) {
		if( typeof markers === "undefined" ) {
			markers = this.markers
		} 
		if(typeof MarkerClusterer !== 'undefined') {
			var map = this.map
			var options = {
				averageCenter: true, 
				imagePath: 'https://raw.githubusercontent.com/googlemaps/v3-utility-library/master/markerclustererplus/images/m'
			}
			this.clusterer = {}
			this.clusterer.markerClusterer = new MarkerClusterer(map, markers, options)
			this.clusterer.maxZoom = this.clusterer.markerClusterer.getMaxZoom()
			this.clusterer.gridSize = this.clusterer.markerClusterer.getGridSize()
			this.hideClusters()
		}
		else {
			console.error("MarkerClusterer Library Required")
		}
		return this.clusterer.markerClusterer
	},

	oneOnOneMarkers: function() {
		this.clusterer.markerClusterer.setGridSize(1);
		this.clusterer.markerClusterer.repaint();
	},

	showClusters: function() {
		if(typeof this.clusterer.markerClusterer !== "undefined") {
			this.clusterer.markerClusterer.setMaxZoom(this.clusterer.maxZoom);
			this.clusterer.markerClusterer.setGridSize(this.clusterer.gridSize);
			this.clusterer.markerClusterer.repaint();
		}
		else {
			console.error("Clusterer Object Not Present");
		}
	},

	hideClusters: function() {
		if(typeof this.clusterer.markerClusterer !== "undefined") {
			this.clusterer.markerClusterer.setMaxZoom(1);
			this.clusterer.markerClusterer.setGridSize(1);
			this.clusterer.markerClusterer.repaint();
		}
		else {
			console.error("Clusterer Object Not Present");
		}
	},

	deleteClusters: function() {
		if( this.clusterer && this.clusterer.markerClusterer ) {
        	this.clusterer.markerClusterer.clearMarkers()
		}
	},

	createHeatmap: function(locations) {
	    var heatmapData = [];
		if( typeof locations !== "undefined" ) {
	        this.markers.forEach( function(element, index) {
	            heatmapData.push({location: element.getPosition(), weight: 1});
	        });
		}
		else {
			heatmapData = locations;
		}
		
		if( !this.heatmap ) {
	        this.heatmap = new google.maps.visualization.HeatmapLayer({
	        	data: heatmapData,
	        	radius: 30,
	        	opacity: 0.7,
	        });
	        var gradient = [
	         'rgba(0, 255, 255, 0)',
	         'rgba(0, 255, 255, 1)',
	         'rgba(0, 191, 255, 1)',
	         'rgba(0, 127, 255, 1)',
	         'rgba(0, 63, 255, 1)',
	         'rgba(0, 0, 255, 1)',
	         'rgba(0, 0, 223, 1)',
	         'rgba(0, 0, 191, 1)',
	         'rgba(0, 0, 159, 1)',
	         'rgba(0, 0, 127, 1)',
	         'rgba(63, 0, 91, 1)',
	         'rgba(127, 0, 63, 1)',
	         'rgba(191, 0, 31, 1)',
	         'rgba(255, 0, 0, 1)'
	       ]
	       this.heatmap.set('gradient', gradient);
		}
		else {
			this.heatmap.setData(heatmapData)
		}
		return this.heatmap
	},

	showHeatmap: function() {
		this.heatmap.setMap(maplib.map);
	},

	hideHeatmap: function() {
		this.heatmap.setMap(null);
	},

	toggle: function(objects) {
		if( objects instanceof Array ) {
			objects.forEach( function(object) {
        		object.setMap(object.getMap() ? null : this.map);
			});
		}
		else {
        	objects.setMap(objects.getMap() ? null : this.map);
		}
    },
}

// marker click event
// google.maps.event.addListener(this.marker,'click',function() {
// 	alert('asdfsdf');
// });