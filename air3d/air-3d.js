const container = document.getElementById( 'gl' );

prefix = 'data/observations/';
suffix = '.js';

//tile servers: https://wiki.openstreetmap.org/wiki/Tile_servers
//map tiler: https://cloud.maptiler.com/account/keys/

 var datasource = {
  elevation: {
    apiKey: '13113dc2a0362476bb6131a8eddcfb084'
  },
  imagery: {
    apiKey: 'rlkd5TJAOOZNiBLdSkPY',
//    urlFormat: 'https://api.maptiler.com/tiles/terrain-rgb/{z}/{x}/{y}.png?key=rlkd5TJAOOZNiBLdSkPY',
//    urlFormat: 'https://c.tile.stamen.com/watercolor/${z}/${x}/${y}.jpg',
    urlFormat: 'https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key={apiKey}',
    attribution: '<a href="https://www.maptiler.com/copyright/">Maptiler</a> <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }
}

jQuery.loadScript = function (url, callback) {
  jQuery.ajax({
      url: url,
      dataType: 'script',
      success: callback,
      async: true
  });
}

Procedural.init( { container, datasource } );

Procedural.setCameraModeControlVisible( true );
Procedural.setCompassVisible( true );
Procedural.setUserLocationControlVisible( true );
Procedural.setRotationControlVisible( true );
Procedural.setZoomControlVisible( true );

window.Procedural = Procedural;

let target = {
//  latitude: -45.38, longitude: 167.34
  latitude: 37.4133981, longitude:  -122.1163721
}

class AirQualityColors 
{
  na = [ 150, 150, 150 ];
  green = [104, 225, 67];
  yellow = [255, 255, 85]; 
  orange = [239, 133, 51];
  red = [234, 51, 36];
  purple = [140, 26, 76];
  deep_purple = [115, 20, 37];
  
  static domain = [50, 100, 150, 200, 250, 300];
  //colors =['#68E143', '#FFFF55', '#EF8533', '#EA3324', '#8C1A4B', '#8C1A4B', '#731425', '#731425', '#731425', '#731425', '#731425'] 
  c = [ green, yellow, orange, red, purple, purple, deep_purple, deep_purple, deep_purple, deep_purple ];
  static colors = 
    [ 
       [104, 225, 67],
        [255, 255, 85], 
      [239, 133, 51],
      [234, 51, 36],
      [140, 26, 76],
      [140, 26, 76],      
      [115, 20, 37],
      [115, 20, 37],      
    ];

  //static colors = [ '#68E143', '#FFFF55', '#EF8533', '#EA3324', '#8C1A4B', '#8C1A4B', '#731425', '#731425' ];
  //static mapping = [ 0, 50, 100, 150, 200, 250, 300 ];

  static componentToHex(c) {
      var hex = c.toString(16);
      return hex.length == 1 ? "0" + hex : hex;
    }

  static rgbToHex(r, g, b) {
      return "#" + AirQualityColors.componentToHex(r) + AirQualityColors.componentToHex(g) + AirQualityColors.componentToHex(b);
  }

  static getColor(aqi)
  {
      if (aqi < 0)
        aqi = 0;
      else if (aqi > 300)
        aqi = 300;

      let colorIndex = int(aqi/50);

      let c0 = AirQualityColors.colors[colorIndex];
      let c1 = AirQualityColors.colors[colorIndex + 1];
      let t = (aqi % 50) / 50.0;

      if (c0 == undefined)
        console.log("undefined! " + aqi);

      let c = [
        int(c0[0] + (c1[0]-c0[0]) * t),
        int(c0[1] + (c1[1]-c0[1]) * t),
        int(c0[2] + (c1[2]-c0[2]) * t)
      ];

      return c;
  }

  static getColorHex(aqi)
  {
      let rgb = [0, 0, 0];
      let colors = -1;

      try {
        rgb = AirQualityColors.getColor(aqi);
      }
      catch (err) {
        console.log(err + " [ aqi: " + aqi + " ]");
      }

      return AirQualityColors.rgbToHex(rgb[0], rgb[1], rgb[2]);
  
  }
};

class Overlays
{
  self;

  static object;

  constructor()
  {
    this.self = this;
    this.overlayLoaded = false;
    this.updateInterval = 1000;
    this.nOverlays = 10;
    this.overlays = []; 
    this.dates = [];
    this.current = -1;
    this.show = false;

    Overlays.object = self;
  }

  static buildFromData(data, name)
  {
    let o = {};
    o.type = "FeatureCollection";
    o.name = name;
    o.features = [];
    
    for (let i = 0; i < data.length; i++)
    {
      let node = {};
      node.type = 'Feature';
      node.id = data[i][0];
      
      let geometry = {};
      geometry.type = 'Point';
      geometry.coordinates = [data[i][1], data[i][2]];
//      geometry.coordinates = [ -122.1163721, 37 ];
      node.geometry = geometry;
    
      let aqi = parseInt(data[i][3]);
//      console.log(aqi);
      let colorAqi = AirQualityColors.getColorHex(aqi);

      node.properties = {};
      node.properties.borderRadius = 25;
      node.properties.color = '#ffffff';
      node.properties.padding = 10;
  //    node.properties.name = aqi;
      node.properties.background = colorAqi; //data[i][4];
      
//      console.log(node.id + " " + data[i][1] + " " + data[1][2] + " " + aqi + " " + colorAqi);

      o.features.push(node);
    }
    
    console.log("Read " + data.length + " features.");

    return o;
  }

  loadFromFiles()
  {
      let self = this;

      this.current++;  
      let filename = prefix + self.current + suffix;

      if (this.overlays.length >= this.nOverlays)
      {
        if (!this.overlayLoaded)
          window.setInterval(function(){

            if (self.nOverlays != self.overlays.length)
              return;
            
            if (!self.show)
              return;

            self.current = (self.current + 1) % self.nOverlays;          
            let overlay = self.overlays[self.current];

            Procedural.addOverlay( overlay );
      
          }, self.updateInterval);
    
        self.overlayLoaded = true;    
        return;
      }
  
      $.loadScript(filename, function() {  
        let overlay = Overlays.buildFromData(data, "map");
        self.overlays.push(overlay);
        self.dates.push(date);
        //console.log(self.overlays.length + " " + self.date);
        //console.log(data);
  
        self.loadFromFiles();
      });  
  }

  getText()
  {
    if (!this.overlayLoaded)
    {
      let percentage = (100 * this.overlays.length / this.nOverlays).toFixed(0);
      return "Loaded " + percentage + "%...";
    }
    
    return this.dates[this.current];
  }
};




var configuration = {
  // Minimum distance camera can approach scene
//  minDistance: 1000,
  // Maximum distance camera can move from scene
//  maxDistance: 10000,
  // Maximum distance camera target can move from scene
//  maxBounds: 7500,
  // Minimum polar angle of camera
//  minPolarAngle: 0.25 * Math.PI,
  // Maximum polar angle of camera
//  maxPolarAngle: 0.8 * Math.PI,
  // Set to true to disable panning
  noPan: false,
  // Set to true to disable rotating
  noRotate: false,
  // Set to true to disable zooming
  noZoom: false
};

Procedural.configureControls( configuration );

var environment = {
  title: 'custom',
  parameters: {
    inclination: 0.6,
    fogDropoff: 0.000
  }
};
Procedural.setEnvironment( environment )

Procedural.displayLocation( target );
// Procedural.addOverlay( overlay );
Procedural.focusOnFeature(0);


//o = Overlays.buildFromData(data, "map");
//Procedural.addOverlay(o);