/*define([
], function(	
) {*/

	function OSMMapView(domainObject, openmct, document) {
		this.domainObject = domainObject;
		this.openmct = openmct;
		this.document = document;

		this.unsubscribes = [];
		this.latest = {};
		this.refresh();
	}	

	OSMMapView.prototype.show = function(container) {
		/*
		 * Create a new map inside 
		 */

		console.log("SHOW", container);
		
		// Create a new div element inside the OpenMCT container for the map
		this.elem = document.createElement("div");
		this.elem.style.cssText = "display: list-item; height: 100%; outline: none;"; // TODO: Ugly but works...
		container.appendChild(this.elem);		
		this.map = L.map(this.elem);

		// Add background map
		TOKEN = 'pk.eyJ1IjoicGV0cmlubSIsImEiOiJja2ExZml3YWUwbGZwM2VwbWplMDVmZ2tiIn0.JP6qJNyDiwB0eZR7bwyJng';
		L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' + TOKEN, {
		    attribution: '',
		    maxZoom: 13,
		    id: 'mapbox/dark-v10', // streets-v11',
		    tileSize: 512,
		    zoomOffset: -1,
		    accessToken: 'your.mapbox.access.token'
		}).addTo(this.map).setZIndex(80);

		var paneClass = document.getElementsByClassName('leaflet-pane');
		paneClass.zIndex = "40";

		this.map.setView([60.3245, 24.9685], 10);


		// Groundstation marker
		var gsIcon = L.icon({
			iconUrl:      'gs.png',
			iconSize:     [32, 32],
			shadowSize:   [32, 32],
			iconAnchor:   [16, 16],
			shadowAnchor: [0, 0],
			popupAnchor:  [0, 0]		
		});

		this.gs = L.marker([60.32452, 24.968544], { icon: gsIcon }).addTo(this.map);


		// Satellite marker
		var satIcon = L.icon({
			iconUrl:      'plane.png',
			iconSize:     [32, 32],
			shadowSize:   [32, 32],
			iconAnchor:   [16, 16],
			shadowAnchor: [0, 0],
			popupAnchor:  [0, 0]		
		});

		this.marker = L.marker([60.16, 24.93], { icon: satIcon }).addTo(this.map);
	
		// Create path line
		this.path = L.polyline([], { color: 'red' }).addTo(this.map);
		
		this.refresh();

	};

	OSMMapView.prototype.destroy = function() {
		console.log("DESTROY");

		this.elem.parentNode.removeChild(this.elem);
		this.elem = null;
		this.map.remove();

		this.unsubscribe();
	};


	OSMMapView.prototype.refresh = function() {
		/*
		 * Refresh the map with new settings etc.
		 * - (re)subscribe telemetry defined in the config
		 * - Reload history
		 */
		var domainObject = this.domainObject;
		var requests = [];
		
		this.unsubscribe();

		['latitude', 'longitude'].forEach(function(property) {
			
			/*
			 * Resolve the identity of data fields
			 */
			var idParts = domainObject[property].split(":");
			var identifier = idParts.length > 1 ?
				{ namespace: idParts[0], key: idParts[1] } :
				 idParts[0];
			
			requests.push( this.openmct.objects.get(identifier).then(function (obj) {
				
				/*
				 * Subscribe live telemetry data 
				 */
				this.unsubscribes.push( this.openmct.telemetry.subscribe(
					obj,
					this.handleDatum.bind(this, property)
				));
				
				return this.openmct.telemetry.request(obj, this.openmct.time.bounds());

			}.bind(this)));

		}.bind(this));	

		Promise.all(requests).then(this.handleTelemetryReponses.bind(this));		
	};

	OSMMapView.prototype.unsubscribe = function() {
		/*
		 *  Unsubscribe all real-time telemetry
		 */
		this.unsubscribes.forEach(function(unsubscribe) {
			unsubscribe();
		});
		this.unsubscribes = [];
	};

	OSMMapView.prototype.handleDatum = function(property, datum) {
		/*
		 * New telemetry entry (datum) received
		 */
		console.log("New data ", property, datum);

		if (this.latest.timestamp !== datum.timestamp) {

			this.latest = {}
			this.latest.timestamp = datum.timestamp;
			this.latest[property] = datum.value;

		}
		else {
			this.latest[property] = datum.value;

			if (Object.keys(this.latest).length === 3) {
 
				this.path.addLatLng([this.latest.latitude, this.latest.longitude ]);
				this.marker.setLatLng([this.latest.latitude, this.latest.longitude ]);
			}
		}	
	};

	OSMMapView.prototype.handleTelemetryReponses = function(responses) {
		/*
		 * Received Telemetry history
		 */
		console.log("history", reponses);
		// TODO
	};



//	return OSMMapView;
//})//;
