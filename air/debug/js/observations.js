/*
    Alex Olwal, 2020, www.olwal.com

    Class for sensor data and location index. 
    Reads binary data, computes AQI color, and generates GeoJSON for overlays.

    Externally defined constants/global variables in config.js
*/


class Observations
{
    static preload(index) //load and return index file 
    {
        let file = index;
        let sensors = loadTable(file, 'csv', 'header', 
                    function(sensors)
                    {
                        for (let r = 0; r < sensors.getRowCount(); r++)
                            for (let c = 0; c < sensors.getColumnCount(); c++)
                            {
                                //convert read IDs, longitudes and latitudes to numbers
                                
                                let num = sensors.getNum(r, c);                                
                                sensors.set(r, c, num);
                                
                            }

                        console.log("Loaded and converted index.");
                    }
                );

        return sensors;
    }

    //default bounding box around SF
    constructor(name, longitude, latitude, radius = undefined)//west = -122.516370, east = -122.380372, north = 37.817024, south = 37.616488)
    {       
        this.name = name;
        this.FEATURE_WIDTH = 1;
        this.FEATURE_OPACITY = 0.7;
        this.observations = {};
		this.data = undefined;
		this.loaded = false;
		this.errors = 0;
        this.notInIndex = 0;
        this.count = 0;
		this.aqiSum = 0;
        this.aqiAverage = 0;
        this.rgb = [0, 0, 0];
        this.cancelLoading = false;
        this.ERROR_VALUE = 65535; //should be static

        //limit which sensors to read based on distance from this longitude, latitude and radius in m
        this.longitude = longitude;
        this.latitude = latitude;
        this.radius = radius;

        //bounding box to limit which sensors to load
        /*
        this.EAST = east;
        this.WEST = west;
        this.NORTH = north;
        this.SOUTH = south;
        */

        //should be static, but that's not supported by Safari, so OK to duplicate per object, given small array
        this.MONTHS = [ "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC" ];
    }

    static getMonth(month)
    {
        let MONTHS = [ "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC" ];
        
        return MONTHS[month-1];
    }

    getLocation(id, sensors) //look up longitude/latitude based on sensor id
    {
        let row = sensors.findRow(id, 'id');
        
        if (row && row.arr.length == 3)
            return [ row.arr[1], row.arr[2] ]; //longitude, latitude
        else
            return false;
    }

    getDistanceM(longitude1, latitude1, longitude2 = undefined, latitude2 = undefined)
    {
        if (longitude2 == undefined)
            longitude2 = this.longitude;

        if (latitude2 == undefined)
            latitude2 = this.latitude;
                
        let R = 6371; //earth's radius (km)

        let PI_180 = PI/180;

        let deltaLatitude = (latitude2-latitude1) * PI_180;
        let deltaLongitude = (longitude2-longitude1) * PI_180;

        let a = pow(sin(deltaLatitude/2), 2) +
                cos(latitude1 * PI_180) * cos(latitude2 * (PI_180)) *
                pow(sin(deltaLongitude/2), 2);;

        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        let d = R * c;
        
        return d*1000;
    }

    load(filename, sensors, callback) //load binary data, preprocess and compute AQI color and generate JSON for overlay geometry
    {
        this.filename = filename;

        //Extract date/time information from filename
        this.hour_string = filename.slice(-6, -4);
        this.day_string = filename.slice(-9, -7);
        this.month_string = filename.slice(-12, -10)
        this.year_string = filename.slice(-17, -13)
        this.month = int(this.month_string) - 1;

        this.month_text = "";
        if (this.month >= 0 && this.month < 12)
            this.month_text = this.MONTHS[this.month];

        this.date_string = this.month_text + " " + this.day_string;

        //callback when completed
        this.callbackFunction = callback;

        let self = this;

        if (this.cancelLoading) //allow for interruption, since might be loading large number of files
        {
            this.abort();
            return;
        }

        loadArrayBuffer(filename,     
            function onLoadedData(result)
            {
                if (self.cancelLoading) //allow interruption
                {
                    self.abort();
                    return;
                }

                try //load binary data
                {
                    self.data = new Uint16Array(result.bytes);
                }
                catch (err)
                {
                    console.log(err);
                }

				self.count = 0; //track # of loaded sensors
				self.errors = 0; //track # of errors

                for (let i = 0; i < self.data.length - 1; i += 2)
                {
                    if (self.cancelLoading) //allow interruption
                    {
                        self.abort();
                        return;
                    }
    
                    //collect data
                    let id = self.data[i];
                    let aqi = self.data[i + 1];
                    let location = self.getLocation(id, sensors);

					if (aqi == self.ERROR_VALUE) //exclude error values (e.g., from NaN)
					{
						self.errors++;
						continue;
					}

                    if (!location) //exclude sensors that are not found in sensors table (and thus have no location)
                    {
						self.notInIndex++;
                        // print("Not found in lookup!" + id);
                        continue;
                    }

                    //limit sensors to load based on distance to location
                    if (self.radius > 0 && self.radius != undefined) //skip check if radius has no meaningful value
                    {
                        let distance = self.getDistanceM(location[0], location[1]);

                        if (distance > self.radius)
                            continue;	                        
                    }

                    //limit sensors to load based on this bounding box
                    /*
                    if (location[0] > self.EAST || location[0] < self.WEST || 
                        location[1] < self.SOUTH || location[1] > self.NORTH)
						continue;					
                    */

					self.count++;
                    self.aqiSum += aqi;
                    
                    //key-value store: id => [ aqi, longitude, latitude ]
                    self.observations[id] = [ aqi, location[0], location[1] ]; 

                    self.aqiAverage = self.aqiSum/self.count; //update average for all sensors
                    self.rgb = AirQuality.getColor(self.aqiAverage); //update AQI color
                }

                self.json = Observations.getFeatureCollectionJson(self.name, self.observations, self.FEATURE_OPACITY, self.FEATURE_WIDTH); //generate GeoJSON for overlays
                self.jsonInactive = Observations.getFeatureCollectionJson(self.name, self.observations, self.FEATURE_OPACITY / 2, self.FEATURE_WIDTH); //generate GeoJSON for overlays
                
                self.loaded = true;

                if (self.callbackFunction) //callback when completed
                    self.callbackFunction(self);
            }
        );
    }

    static getFeatureCollectionJson(name, observations, opacity = 0.5, width = 1)
    {
        let o = {};
        o.type = "FeatureCollection";
        o.name = name;
        o.defaults = {
            "properties": {
                "clipping": "pixel",
                "image": "_",
                "width": 0,                    
                "padding": width,
                "anchor": "bottom",
                }
        };
        
        o.features = Observations.getFeaturesJson(name, observations, opacity, width);

        return o;
    }

    static getFeaturesJson(name, observations, opacity = 0.5, width = 1)
    {        
        let features = [];
    
        let ids = Object.keys(observations);

        for (let id of ids)
        {
            let aqi = observations[id][0];

            let longitude = observations[id][1];
            let latitude = observations[id][2];

//            let colorAqi = 'rgba(255,255,255,' + opacity + ")";
	  
			let rgb = AirQuality.getColor(aqi);
            let colorAqi = "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + opacity + ")";

            let feature = {
                "geometry": {
                    "type": "Point",
                    "coordinates": [longitude, latitude]
                    },
                "type": "Feature",
                "id": name + id,
                "properties": {
                    "height": 20 + 150 * min(5000, Math.pow(aqi, 1.5))/5000,
                    "background": colorAqi,       
                    }
                };
            
            features.push(feature);
        }         

        return features;
    }

    static getFeaturesJsonClickable(observations, opacity = 0.5)
    {
        let o = {};
        o.type = "FeatureCollection";
        o.name = "sensors";
        
        o.features = [];
    
        let ids = Object.keys(observations);

        for (let id of ids)
        {
            let aqi = observations[id][0];

            let longitude = observations[id][1];
            let latitude = observations[id][2];

//            let colorAqi = 'rgba(255,255,255,' + opacity + ")";
	  
			let rgb = AirQuality.getColor(aqi);
            let colorAqi = "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + opacity + ")";

            let feature = {
                "geometry": {
                    "type": "Point",
                    "coordinates": [longitude, latitude]
                    },
                "type": "Feature",
                "id": id,
                "properties": {
                    "name": "|",
                    "width": 3,                    
                    "fontSize": 20 + 150 * min(5000, Math.pow(aqi, 1.5))/5000,
                    "color": colorAqi,       
                    "anchor": "bottom",
                    }
                };
            
            o.features.push(feature);
        }         

        return o;
    }

    cancel() //external modules can call to try halt the loading of data
    {
        this.cancelLoading = true;
    }

    abort() //internal abort and exit
    {
        this.loaded = false;

        if (this.callbackFunction)
            this.callbackFunction(this);   
    }    
}