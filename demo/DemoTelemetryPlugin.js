/*
 * Dummy telemetry data producer plugin
 */

function DemoTelemetryPlugin() {

    return function install(openmct) {

        var subsriptions = { };

        function latitude(t) {
            var radius = 0.3 + 0.2 * Math.cos(1.618 * t / 10000);
            lat = 60.3245 + radius * Math.cos( t / 30000 );
            return lat;
        }

        function longitude(t) {
             var radius = 0.3 + 0.2 * Math.cos(1.618 * t / 10000);
             var lon = 24.9685 + radius * Math.sin( t / 30000 );
             return lon;
        }

        /*
         * Foresail telemetry provider defines the interface for telemetry transfer
         */
        openmct.telemetry.addProvider({

            /*
             * Support subscribing
             */
            supportsSubscribe: function (domainObject, callback, options) {
                return domainObject.type === 'demo.telemetry' || domainObject.type === 'demo.location';
            },


            /*
             * Callback to subscribe a Foreasail data point
             */
            subscribe: function (domainObject, callback) {

                console.log("subscribe " + domainObject.identifier.key);
                var interval_handle;
                var key = domainObject.identifier.key;

                if (key === "gps.latitude") {
                    interval_handle = setInterval( function() {
                        var t = new Date().valueOf();
                        callback({ id: 'gps.latitude', timestamp: t,  value: latitude(t) });
                    }, 1000);
                }
                else if (key === "gps.longitude") {
                    interval_handle = setInterval( function() {
                        var t = new Date().valueOf();
                        callback({ id: 'gps.longitude', timestamp: t, value: longitude(t) });
                    }, 1000);
                }
                else if (key === "gps.location") {
                    interval_handle = setInterval( function() {
                        var t = new Date().valueOf();
                        callback({ id: 'gps.location', timestamp: t, latitude: latitude(t), longitude: longitude(t) });
                    }, 1000);
                }

                // Add callback to list
                subsriptions[key] = interval_handle;

                /*
                 * Return the unsubscribing callback
                 */
                return function unsubscribe() {
                    clearTimeout(subscriptions[key]);
                    delete subsriptions[key];
                };

            },

            /*
             * Support history requesting
             */
            supportsRequest: function (domainObject, options) {
                return domainObject.type === 'demo.telemetry' || domainObject.type === 'demo.location';
            },

            /*
             * History request for a Demo data points
             */
            request: function(domainObject, options) {

                var key = domainObject.identifier.key;
                console.log("request " + options.strategy + ": " + key);

                var telemetry = [ ];

                if (options.strategy == "latest") {
                
                    var t = new Date().valueOf();
                    if (key === "gps.latitude")
                        telemetry = [{ timestamp: t, value: latitude(t) }]
                    else if (key === "gps.longitude")
                        telemetry = [{ timestamp: t, value: longitude(t) }]
                    else 
                        telemetry = [ { timestamp: t, latitude: latitude(t), longitude: longitude(t) }]


                }
                else {


                if (options.end > new Date().valueOf())
                    options.end = new Date().valueOf();


                var step = Math.max(1000, (options.end - options.start) / options.size);

                if (key === "gps.latitude" || key === "gps.longitude") {
                    var lat = (key === "gps.latitude");
                    for (var i = 0; i < options.size; i++) {
                        var t = options.start + step * i;
                        telemetry.push({ timestamp: t, value: (lat ? latitude(t) : longitude(t)) })
                    }
                }
                else {
                    for (var i = 0; i < options.size; i++) {
                        var t = options.start + step * i;
                        telemetry.push({ timestamp: t, latitude: latitude(t), longitude: longitude(t) })
                    }
                }
                }
                return Promise.resolve(telemetry);
            }

        });


        /*
         * Create root object for all the Demo stuff
         */
        openmct.objects.addRoot({
            namespace: 'demo',
            key: 'gps'
        });


        /*
         * Foresail object provider tells the detailed information to OpenMCT about the object
         */
        openmct.objects.addProvider('demo', {
            get: function (identifier) {

                //console.log("get " + identifier.key);

                if (identifier.key === 'gps') {
                    /*
                     * Return type of the root
                     */
                    return {
                        identifier: identifier,
                        name: 'Demo GPS Telemetry',
                        type: 'folder',
                        location: 'ROOT'
                    };
                }
                else {

                     if (identifier.key === 'gps.latitude' || identifier.key === 'gps.longitude') {
                        /*
                         * Return structure of the latitude and longitude data fields
                         */
                        
                        return {
                            identifier: identifier,
                            name: ((identifier.key === 'gps.latitude') ? "Latitude" : "Longitude"),
                            type: 'demo.telemetry',
                            location: 'demo:gps',
                            telemetry: {
                                values: [
                                    {
                                        key: "value",
                                        name: "Value",
                                        units: "degrees",
                                        format: "float",
                                        hints: { range: 1 }
                                    },
                                    {
                                        key: "utc",
                                        source: "timestamp",
                                        name: "Timestamp",
                                        format: "utc",
                                        hints: { domain: 1 }
                                    }
                                ]
                             }
                        };


                    }
                    else { // if (identifier.key === 'gps.location')
			
                        /*
                         * Return structure of the location data
                         */
                        return {
                            identifier: identifier,
                            name: 'Location',
                            type: 'demo.location',
                            location: 'demo:gps',
                            telemetry: {
                                values: [
                                    {
                                        key: "latitude",
                                        name: "Latitude",
                                        units: "degrees",
                                        format: "float",
                                        hints: { range: 1 }
                                    },
                                    {
                                        key: "longitude",
                                        name: "Longitude",
                                        units: "degrees",
                                        format: "float",
                                        hints: { range: 1 }
                                    },
                                    {
                                        key: "utc",
                                        source: "timestamp",
                                        name: "Timestamp",
                                        format: "utc",
                                        hints: { domain: 1 }
                                    }
                                ]
                             }
                         };





                    }

                }
                
            }
        });


        /*
         * Composition provider tells the hierarchy of the objects. Aka what is inside of what.
         */
        openmct.composition.addProvider( {
            appliesTo: function (domainObject) {
                return domainObject.identifier.namespace === 'demo' && domainObject.type === 'folder';
            },
            load: function (domainObject) {
                //console.log("load " + domainObject.identifier.key);

                /*
                 * Return content of Demo Telemetry folder
                 */
                return Promise.resolve([
                    { namespace: "demo", key: "gps.latitude" },
                    { namespace: "demo", key: "gps.longitude" },
                    { namespace: "demo", key: "gps.location" },
                ]);

            }
        });

        /*
         * Custom type identificator for Demo telemetry fields (single number)
         */
        openmct.types.addType('demo.telemetry', {
            name: 'Demo Telemetry Field',
            description: 'Foresail housekeeping frame',
            cssClass: 'icon-telemetry'
        });

        /*
         * Custom type identificator for Demo location telemetry
         */
        openmct.types.addType('demo.location', {
            name: 'Demo Location Data Point',
            description: 'Demo Location data point',
            cssClass: 'icon-telemetry'
        });


    }
}
