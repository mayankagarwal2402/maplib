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
	    strokeWeight: 10,
	    map: null
	},

	// loads a map into specified div on the page
	loadMap: function( mapDiv ) {
		geocoder = new google.maps.Geocoder();
		var latlng = new google.maps.LatLng(12.949,77.644);
		var mapOptions = {
			zoom: 11,
			center: latlng,
			mapTypeId: 'roadmap'
		}
		this.map = new google.maps.Map(document.getElementById(mapDiv), mapOptions);
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
	showMarkers: function() {
		this.setAllMap(this.map);
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

	// Gets a random colored pin url for marker image
	getNewPin: function() {
		var hex = "";
	    for( var i = 1; i <= 6; i++ ){
	        hex += "0123456789ABCDEF".charAt( Math.floor( ( Math.random()*16 ) ) );
	    }
		pinImage =  new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + hex);
		return pinImage;
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

	hidePolyline: function() {
		if( this.polyline ) { this.polyline.setMap(null); }
	},

	deletePolyline: function() {
		if( this.polyline ) { this.polyline.setMap(null); }
		this.polyline = '';
	},

	addToPolyline: function( marker ) {
		this.polyline = this.polyline || new google.maps.Polyline(this.polyOptions);
		var path = this.polyline.getPath();
		this.markers.forEach(function(marker){
			path.push( marker.position );
		});
	}
}

// marker click event
// google.maps.event.addListener(this.marker,'click',function() {
// 	alert('asdfsdf');
// });