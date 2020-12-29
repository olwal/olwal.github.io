const containerP5 = document.getElementById('p5');

let canvasWidth = 400;
let canvasHeight = 30;

let bbox = [ -123.431396,35.855666,-120.215149,38.801189 ];

let air;

let updateInterval = 30000;

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

function setup()
{
    air.init(updateInterval);
    air.onUpdateCallback = function(sensors)
    {       
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

    let can = createCanvas(canvasWidth, canvasHeight);
    can.parent(containerP5);

    textSize(canvasHeight * 0.8);
    textFont("Inter");
    textAlign(CENTER);

//   o = Overlays.buildFromData(data, "map");
//   Procedural.addOverlay(o);

//    overlayObject.loadFromFiles();
}
  
function mousePressed()
{
//    playback = !playback;
//    realtime = !realtime;
//    console.log(playback);
//    overlayObject.active = playback;
}

function draw()
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

class PurpleAir 
{
    self;
    static colors;
    static mapping;

    preload()
    {
        self = this;
        PurpleAir.colors = [ '#68E143', '#FFFF55', '#EF8533', '#EA3324', '#8C1A4B', '#8C1A4B', '#731425' ];
        PurpleAir.mapping = [ 0, 50, 100, 150, 200, 250, 300 ];
        this.sensors = loadTable(dataPath, 'csv', 'header');   
    }

    init(updateInterval)
    {
        self.updateInterval = updateInterval;

        for (let r = 0; r < self.sensors.getRowCount(); r++)
            for (let c = 0; c < self.sensors.getColumnCount(); c++)
            {
                //let num = self.sensors.getString(r, c);
                let num = self.sensors.getNum(r, c);
                //print(r + " " + c + " " + num + " " + int(num));
                self.sensors.set(r, c, num);
            }
                
        self.sensors.addColumn('aqi');
        self.sensors.addColumn('temp_f');
        self.sensors.addColumn('label');

        self.nSensors = self.sensors.rows.length;
        self.nSensorsUpdated = 0;
        self.updatingSensors = false;

        self.fetchData();
    }

    fetchData() 
    {           
        for (var i = 0; i < self.nSensors; i++)
        {
            //let self = this; 

            let sensorId = air.sensors.rows[i].arr[0]; //id
            let url = "https://www.purpleair.com/json?show=" + sensorId;
            //print(url);		
            setTimeout(function() { 
                try
                { loadJSON(url, self.onFetched) }
                catch
                {
                    console.log("failed at JSON");
                    self.onFetched(undefined);
                }
                
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