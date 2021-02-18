/*
    Alex Olwal, 2020, www.olwal.com
    
    3D map using procedural-gl.js
    (https://github.com/felixpalmer/procedural-gl-js)
*/

/*
Externally defined constants/global variables:
Example:

const API_KEY_ELEVATION = '******************************';
const API_KEY_MAP_TILER = '******************************';

const DIV_GL = 'gl';

var ORBIT_AFTER_FOCUS = true;

const MAP_TARGET = {
    latitude: 37.512070759717645, longitude: -122.29158348430136,
    distance: 50000,
    angle: 35, bearing: -20
};
  
const GL_CONFIGURATION = {
    // Minimum distance camera can approach scene
  //  minDistance: 1000,
    // Maximum distance camera can move from scene
    maxDistance: 50000,
    // Maximum distance camera target can move from scene
    maxBounds: 7500000,
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

const GL_ENVIRONMENT = {
    title: 'custom',
    parameters: {
        inclination: 45,
        fogDropoff: 0.000
    }
};
*/

const container = document.getElementById(DIV_GL);

//tile servers: https://wiki.openstreetmap.org/wiki/Tile_servers
//map tiler: https://cloud.maptiler.com/account/keys/

//configure data sources for elevation and map imagery
 var datasource = {
  elevation: {
    apiKey: API_KEY_ELEVATION
  },
  /*
  imagery: {
    apiKey: API_KEY_MAP_TILER,
    urlFormat: 'https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key={apiKey}',
    attribution: '<a href="https://www.maptiler.com/copyright/">Maptiler</a> <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }
  imagery: {
    crossOrigin: null,
    urlFormat: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
  }
}*/

imagery: {
//  urlFormat: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
//	maxZoom: 19,
//	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

//attribution: '<a target="_blank" href="https://www.geoportail.gouv.fr/">Geoportail France</a>',
minZoom: 2,
maxZoom: 19,
apikey: 'choisirgeoportail',
format: 'image/jpeg',
style: 'normal',
//urlFormat: "https://wxs.ign.fr/choisirgeoportail/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
//urlFormat: 'https://stamen-tiles.a.ssl.fastly.net/terrain-background/{z}/{x}/{y}.png',
ext: 'png',
s: 'a',

//urlFormat: 'https://stamen-tiles.a.ssl.fastly.net/toposm-color-relief/{z}/{x}/{y}.jpg', //***


urlFormat: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',  //ok, but breaks with different zoom levels
attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'


//urlFormat: 'https://tiles.wmflabs.org/hikebike/{z}/{x}/{y}.png' //broken

//urlFormat: 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png'

//urlFormat: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}",

//urlFormat: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',
//urlFormat: 'https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}.png', 
//urlFormat: 'https://tile.openstreetmap.bzh/br/{z}/{x}/{y}.png', 
  //attribution: '<a href="https://www.openaip.net/">openAIP Data</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-NC-SA</a>'

}
 }


//initialize with container and data sources
Procedural.init( {container, datasource} );

//show user interface controls
/*
Procedural.setCameraModeControlVisible(true);
Procedural.setCompassVisible(true);
Procedural.setRotationControlVisible(true);
Procedural.setZoomControlVisible(true);
*/
Procedural.setCompassVisible(false);

window.Procedural = Procedural;

//start orbiting after location is focused
Procedural.onLocationFocused = 
  function () 
  {
    if (ORBIT_AFTER_FOCUS)
      Procedural.orbitTarget();
  };

//use externally defined settings to set up camera, rendering and location
Procedural.configureControls(GL_CONFIGURATION);
Procedural.setEnvironment(GL_ENVIRONMENT);
Procedural.displayLocation(MAP_TARGET);