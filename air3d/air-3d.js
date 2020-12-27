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
/*
Procedural.setCameraModeControlVisible( true );
Procedural.setCompassVisible( true );
Procedural.setUserLocationControlVisible( true );
Procedural.setRotationControlVisible( true );
Procedural.setZoomControlVisible( true );
*/


window.Procedural = Procedural;

let target = {
//  latitude: -45.38, longitude: 167.34
  latitude: 37.4133981, longitude:  -122.1163721
}

data2 = [
  [ 0, -122.1163721, 37.4133981, 72.0, '#ffff9f' ], 
  [ 1, -122.1163721, 37.6133981, 72.0, '#ffff9f' ], 
]

let o = {};
o.type = "FeatureCollection";
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
  node.properties.color = '#ffffff';
  node.properties.padding = 10;
  node.properties.name = data[i][3];
  node.properties.background = data[i][4];
  
  o.features.push(node);
}

let overlay = o;

Procedural.displayLocation( target );
Procedural.addOverlay( overlay );
Procedural.focusOnFeature(0);