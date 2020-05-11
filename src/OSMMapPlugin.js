/*define([
	'./OSMMapView'

], function(
	OSMMapView
) {
	return*/
	function OSMMapPlugin() {
		return function install(openmct) {
		openmct.types.addType('view.osmmap', {
			name: 'OSM Map',
			description: 'OpenStreetMap 2D map plugin',
			key: 'view.osmmap',
			cssClass: 'icon-object',
			creatable: true,
			initialize: function (obj) {

			},
			form: [
				{
					key: 'latitude',
					name: 'Latitude',
					control: 'textfield',
					required: true
				},				
				{
					key: 'longitude',
					name: 'Longitude',
					control: 'textfield',
					required: true
				},
				{
					key: 'altitude',
					name: 'Altitude',
					control: 'textfield',
					required: false
				}

			]			
		});

		openmct.objectViews.addProvider({
			name: 'OSM Map',
			key: 'osmmap',
			cssClass: 'icon-object',
			canView: function (d) {
				return d.type === 'view.osmmap';
			},
			view: function (domainObject) {
				return new OSMMapView(domainObject, openmct, document);
			}
		});
		};

	}
//});

