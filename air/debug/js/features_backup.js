/*
    Alex Olwal, 2020, www.olwal.com
    
    Class with static method to build FeatureCollection for use as overlays on 3D map.
    See: https://tools.ietf.org/html/rfc7946
*/

class Features
{
  static cities;

  static preload()
  {
    console.log(LANDMARKS_PATH);
    Features.cities = loadTable(LANDMARKS_PATH, 'csv', 'header');
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
      node.geometry = geometry;
    
      let aqi = parseInt(data[i][3]);

      if (isNaN(aqi))
        continue;

      let colorAqi = data[i][8];

      node.properties = {};
      node.properties.borderRadius = 0;
      node.properties.color = '#ffffff';
      node.properties.padding = 0;
      node.properties.color = colorAqi;
      node.properties.fontSize = 20 + 150 * min(5000, Math.pow(aqi, 1.5))/5000;
      
      node.properties.name = "|";
      node.properties.anchor = "bottom";
      node.properties.fadeDistance = 100000;
      node.properties.anchorOffset = { x: 0, y: 0 };
      o.features.push(node);
    }
    
    console.log("Read " + data.length + " features.");

    return o;
  }

  static getBayAreaFeatures()
  {   
    let o = {};
    o.type = "FeatureCollection";
    o.name = "cities";

    let count = 0;

    o.features = [];

    console.log("length: " + Features.cities.rows.length);    

    for (let row of Features.cities.rows)
    {
      if (row.arr[3] == '0')
        continue;

      let name = row.arr[0];
      let latitude = parseFloat(row.arr[1]);
      let longitude = parseFloat(row.arr[2]);
      let show = row.arr[3];

      let feature = {
        "geometry": {
          "type": "Point",
          "coordinates": [longitude, latitude]
        },
        "type": "Feature",
        "id": count,
        "properties": {
          "fontSize": 10 + (50 / (show * show)),
          "color": "white",        
          "name": name,
          "anchorOffset": {
            "y": 0,
            "x": 0
          },
          "anchor": "bottom",
          "borderRadius": 25,
          "padding": 10,
          "borderWidth": 0,
          "fadeDistance": 250000,
          }
        };

      count += 1;
      o.features.push(feature);
    } 
    return o;
  }
}
