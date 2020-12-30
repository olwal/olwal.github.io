const containerP5 = document.getElementById('p5');

let canvasWidth = window.innerWidth; //400;
let canvasHeight = 20;

// let bbox = [ -123.431396,35.855666,-120.215149,38.801189 ];

let air;

let updateInterval = 60000;

let dataPath = 'data/outside_sensors_bay_area.csv';

function preload() 
{
    air = new PurpleAir();
    air.preload();
}

var callbackData = []

let playback = false;
let realtime = true;

let lastUpdated = -1;
var overlayObject = new Overlays();

let initialized = false;

function setup()
{
    air.init(updateInterval);
    //air.init(updateInterval, 10);
    
    self = air;

    air.onUpdateCallback = function(sensors)
    {       
        if (!initialized)
        {
//        Procedural.environmentEditor();
        //Procedural.focusOnBounds(bounds);
        //console.log(self.bounds);
            Procedural.focusOnLocation(target);

            Procedural.onFeatureClicked = function (id) {
                // console.log( 'Feature clicked:', id );
                self.updateSelected(id);
            }

            initialized = true;
        }

        if (self.selected != undefined)
        {
            self.updateSelected(self.selected[0]);
        }

        callbackData = []
        
        for (let r = 0; r < sensors.getRowCount(); r++)
            callbackData.push(sensors.rows[r].arr);    
    
        if (realtime)
        {
            o = Overlays.buildFromData(callbackData, "map");
            Procedural.addOverlay(o);

            lastUpdated = millis();
        }
    }

    let can = createCanvas(canvasWidth, canvasHeight * 2);
    can.parent(containerP5);

    textSize(canvasHeight * 0.5);
    textFont("Inter");
    textAlign(CENTER);


/*
    bounds = {
        sw: { latitude: bbox[0], longitude: bbox[3] },
        ne: { latitude: bbox[2], longitude: bbox[1] }        
    };

    Procedural.focusOnBounds(bounds);
*/
//   o = Overlays.buildFromData(data, "map");
//   Procedural.addOverlay(o);

//    overlayObject.loadFromFiles();
}
  
function keyPressed()
{
    Procedural.focusOnLocation(target);
//    playback = !playback;
//    realtime = !realtime;
//    console.log(playback);
//    overlayObject.active = playback;
}

function draw()
{
    drawAbove();
}

function drawAbove()
{
    background(255);

    let textString = "Preparing data...";

    if (air.updatingSensors)
    {
        fraction = air.nSensorsUpdated/air.nSensors;
        noStroke();
        fill(100, 100);
        rect(0, height * 0.8, width * fraction, height);

        textString = "Real-time air quality sensor data: Updated " + (100 * fraction).toFixed(0) + "%";
    }
    else
    {
        noStroke();
        fill(100, 100);
        rect(0, height * 0.8, width, height);

        if (lastUpdated >= 0)
            textString = "Real-time air quality sensor data: Updated " + ((millis() - lastUpdated)/1000).toFixed(0) + "s ago";
    }

//    console.log(textString + " " + air.updatingSensors + " " + air.nSensors);

    w = textWidth(textString);

    fill(100);
    textAlign(LEFT);
    text(textString, textSize()/4, textSize() * 1.3);

    if (air.selected != undefined)
    {
        text("AQI " + air.selected[3] + "     " + air.selected[4] + String.fromCharCode(176) + "F     " + 
        //air.selected[5] + " " + air.selected[6] + " " + 
        air.selected[7] + 
        "     longitude " + air.selected[1].toFixed(4) + ", latitude " + air.selected[2].toFixed(4) + "" 
        
        , textSize()/4, textSize() * 2.7);        
    }

}

function drawOverlay()
{
    let textString = "Preparing data...";
    
    if (lastUpdated >= 0)
        textString = "Updated " + ((millis() - lastUpdated)/1000).toFixed(0) + "s ago";
    
    if (playback)
    {
        textString = overlayObject.getText(); //global variable defined in air-3d.js
    
        if (!textString || textString.length == 0)
            textString = "Preparing...";
        else
            textString = textString.substring(0, textString.length-3);
    }

    //console.log(textString);

    noStroke();
    let w = 1.05 * textWidth(textString);
    fill(60);

//    console.log(textString + " " + w);

    rect(width/2 - w/2, 0, w, height);
    fill(255);
    translate(width/2, textSize());
    text(textString, 0, 0);
}

function windowResized() {
    resizeCanvas(windowWidth, canvasHeight);
  }

class PurpleAir 
{
    self;
    static colors;
    static mapping;

    latitudes = [ 10000, -10000 ];
    longitudes = [ 10000, -10000 ];  
    
    selected = undefined;

    preload()
    {
        self = this;
        PurpleAir.colors = [ '#68E143', '#FFFF55', '#EF8533', '#EA3324', '#8C1A4B', '#8C1A4B', '#731425' ];
        PurpleAir.mapping = [ 0, 50, 100, 150, 200, 250, 300 ];
        this.sensors = loadTable(dataPath, 'csv', 'header');   
    }

    init(updateInterval, limitSensorsToLoad = -1)
    {
        self.updateInterval = updateInterval;

        for (let r = 0; r < self.sensors.getRowCount(); r++)
            for (let c = 0; c < self.sensors.getColumnCount(); c++)
            {
                //let num = self.sensors.getString(r, c);
                let num = self.sensors.getNum(r, c);
                //print(r + " " + c + " " + num + " " + int(num));
                self.sensors.set(r, c, num);

                if (c == 1) //longitude
                {
                    if (num < this.longitudes[0])
                        this.longitudes[0] = num;
                    else if (num > this.longitudes[1])
                        this.longitudes[1] = num;
                }
                else if (c == 2) //latitude
                {
                    if (num < this.latitudes[0])
                        this.latitudes[0] = num;
                    else if (num > this.latitudes[1])
                        this.latitudes[1] = num;
                }
            }
                
        this.bounds = {
            sw: { latitude: this.latitudes[0], longitude: this.longitudes[0] }, 
            ne: { latitude: this.latitudes[1], longitude: this.longitudes[1] }
        };

        self.sensors.addColumn('aqi');
        self.sensors.addColumn('temp_f');
        self.sensors.addColumn('pressure');
        self.sensors.addColumn('humidity');
        self.sensors.addColumn('label');

        if (limitSensorsToLoad > 0)
            self.nSensors = limitSensorsToLoad
        else
            self.nSensors = self.sensors.rows.length;
        self.nSensorsUpdated = 0;
        self.updatingSensors = false;

        self.fetchData();
    }

    updateSelected(id)
    {
        let row = this.findRow(id);
        if (row >= 0)
        {
            this.selected = this.sensors.rows[row].arr;
            console.log(this.sensors.rows[row].arr);
        }
        else
            this.selected = undefined;
    }

    fetchData() 
    {         
        self.updatingSensors = true;  
        console.log("Starting update...");
        for (var i = 0; i < self.nSensors; i++)
        {
            //let self = this; 

            let sensorId = air.sensors.rows[i].arr[0]; //id
            let url = "https://www.purpleair.com/json?show=" + sensorId;
            //print(url);		
            setTimeout(function() { 
                 loadJSON(url, self.onFetched, 
                    function (response) { //onError
                        console.log("fetchData: loadJSON" + response);
                        self.onFetched(undefined);
                    }
                    )                 
                }
                , 10);
        }
    }

    binarySearch(values, value)
    {
        let start = 0;
        let end = values.length-1; 
                  
        while (start <= end)
        { 
            let mid = Math.floor((start + end)/2); 

            if (values[mid] == value)
                return mid; 
          
            else if (values[mid] < value)  
                start = mid + 1; 
            else
                end = mid - 1; 
        } 
           
        return -1; 
    }

    findRow(id)
    {
        return self.binarySearch(self.sensors.getColumn("id"), id);
    }

    onFetched(data)
    {
        self.nSensorsUpdated += 1;

        if (data == undefined || data.results == undefined || data.results[0] == undefined)
        {
            console.log("Could not fetch this sensor");
        }
        else
        {
            let results = data.results[0];

            let id = results.ID;
            let pm25 = results.PM2_5Value;
            let aqi = AQIPM25(pm25);

            if (aqi == "PM25message")
                aqi = -1;

            let row = self.findRow(id)

            self.sensors.set(row, "aqi", aqi);
            self.sensors.set(row, "label", results.Label);
            self.sensors.set(row, "temp_f", results.temp_f);
            self.sensors.set(row, "pressure", results.pressure);
            self.sensors.set(row, "humidity", results.humidity);            

            //console.log(id + " " + aqi + " " + self.nSensorsUpdated + " " + self.nSensors);
        }

        if (self.nSensorsUpdated >= self.nSensors)
        {
            self.updatingSensors = false;
            self.nSensorsUpdated = 0;
            self.onUpdateCompleted();
        }
    }

    onUpdateCompleted()
    {
        let self = this;
        console.log("Updated all sensors");

        if (self.onUpdateCallback)
            self.onUpdateCallback(self.sensors);

        if (self.updateInterval < 0)
            return;

        window.setInterval( //self.refresh()
            function() {

                //console.log(self.updatingSensors);

                if (self.updatingSensors || self.nSensorsUpdated > 0)
                    return;
    
                self.fetchData();
            },
            
            self.updateInterval);
    }

    static componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
      }

    static rgbToHex(r, g, b) {
        return "#" + PurpleAir.componentToHex(r) + PurpleAir.componentToHex(g) + PurpleAir.componentToHex(b);
    }

    static getColor(aqi)
    {
        let colorIndex = int(aqi/50);
        let c0 = PurpleAir.colors[colorIndex];
        let c1 = PurpleAir.colors[colorIndex + 1];
        let t = (aqi % 50) / 50.0;

        return lerpColor(color(c0), color(c1), t);
    }

    static getColorHex(aqi)
    {
        let rgb = PurpleAir.getColor(aqi).levels;
        return PurpleAir.rgbToHex(rgb[0], rgb[1], rgb[2]);
    }

}