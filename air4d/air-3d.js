const container = document.getElementById( 'container' );

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

function getOverlay(name)
{
  let o = {};
  o.type = "FeatureCollection";
  o.name = name;
  o.features = [];
  
  for (let i = 0; i < data.length; i++)
  {
    node = {};
    node.type = 'Feature';
    node.id = data[i][0];
    
    geometry = {};
    geometry.type = 'Point';
    geometry.coordinates = [data[i][1], data[i][2]];
    node.geometry = geometry;
  
    node.properties = {};
    node.properties.borderRadius = 25;
    node.properties.color = '#ffffff';
    node.properties.padding = 10;
//    node.properties.name = data[i][3];
    node.properties.background = data[i][4];
    
    o.features.push(node);
  }
  
  return o;
}


jQuery.loadScript = function (url, callback) {
  jQuery.ajax({
      url: url,
      dataType: 'script',
      success: callback,
      async: true
  });
}

//prefix = 'data/2020-12-01_0';
//suffix = '_00_00.js';

prefix = 'data/';
suffix = '.js';

current = 0;

var overlay = 0;
var overlays = []; 
var nOverlays = 264;
var overlayStarted = false;

function loadOverlays()
{
    current++;

    filename = prefix + current + suffix;

    if (overlays.length >= nOverlays)
    {
      if (!overlayStarted)
        window.setInterval(nextOverlayCached, 100);
  
      overlayStarted = true;    
      return;
    }

    $.loadScript(filename, function(){
      overlay = getOverlay("map");
      overlays.push(overlay);
      console.log(overlays.length + " " + date);
      console.log(data);

      loadOverlays();
    });   
}


loadOverlays();

function nextOverlayCached()
{
  if (nOverlays != overlays.length)
    return;

  current = (current + 1) % nOverlays;

  console.log(current);

  Procedural.addOverlay( overlays[current] );
}

function nextOverlay()
{
//  current = ((current + 1) % 4);

//  filename = prefix + (current + 1) + suffix;
//  console.log(filename);

  current = (current + 1) % 264;

  filename = prefix + (current) + suffix;

  $.loadScript(filename, function(){

    if (overlay == 0)
    {
      overlay = getOverlay("2020-12-01");
      Procedural.addOverlay( overlay );
      //Procedural.removeOverlay("2020-12-01");
      //console.log('removed');
    }
    else
    {
//      console.log('added');
      overlay = getOverlay("2020-12-01");
      Procedural.addOverlay( overlay );
    }
  });  
}

// window.setInterval(nextOverlay, 0);

/*
$.loadScript('data/2020-12-01_02_00_00.js', function(){
  let overlay = getOverlay("2020-12-01");
  Procedural.addOverlay( overlay );
});
*/

data2 = [
  [ 0, -122.1163721, 37.4133981, 72.0, '#ffff9f' ], 
  [ 1, -122.1163721, 37.6133981, 72.0, '#ffff9f' ], 
]

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