air = [];
dataLoaded = false;
timeToRefresh = 10; //seconds
timeLoaded = 0;
nAir = 0;
nSensors = 0;
values = [];
labels = [];
aqipm25 = [];
temp = [];
font = 0;

var sensors = [];
var sensorsMap = [];

// 19633&A=28299&J=46475&K=21449&D=44911&D=60163&G=5642&R=15883&S=60231

var locationData = null;

var defaultSensors = [
	19633, 28299, 46475, 21449, 44911, 60163, 5642, 15883, 60231, 2014, 23081 ];

var defaultSensorsMap = {
	"FQKP8TFDAIDZMXTV": "19633",
	"2KITRCU134L3RYS6": "63169",
	"7ETKDV29585KQXFH": "18495",
	"VRDRK0A6WMO0AHX6": "36991",
	"W02G1W6NS121WGVU": "35029",
	"JTNKAV40HCYEJAUO": "21055", //Almond school
	"YZDS57RKGGTSUA3W": "2014", //pasadena
	"7HQ87KA2BFUN86YM": "23081" //santa barbara	
};

function fetchData() {
	
	nSensors = sensors.length;
		
	for (var i = 0; i < nSensors; i++)
	{
		let url = "https://www.purpleair.com/json?show=" + sensors[i];
		print(url);		
		setTimeout(function() { loadJSON(url, processAir) }, 10 * i);		
	}
}


function fetchDataMap() {
	
	let i = 0;
	
	nSensors = Object.keys(sensors).length;
		
	for (var key in sensors)
	{
		let url = "https://www.purpleair.com/json?key=" + key + "&show=" + sensors[key];
		print(url);		
		i++;			
		setTimeout(function() { loadJSON(url, processAir) }, 10 * i);		
	}
}

var sensorTable;

function preload() {
//	fetchData();
//	font = loadFont("fonts/Roboto-Bold.ttf");

	 font = loadFont("fonts/Metropolis-Bold.otf");
	sensorTable = loadTable('data/outside_sensors_minimal_sorted.csv', 'csv', 'header');
}

function processAir(data)
{
	if (data.results == undefined || data.results[0] == undefined)
	{
		nSensors--;
		return;
	}

	let id = data.results[0].ID;
	air[id] = data.results[0];
	
	let value = air[id].PM2_5Value;
	aqipm25[id] = AQIPM25(value);

	print(id + ": " + value + " -> " + aqipm25[id]);

	nAir = Object.keys(air).length;
	
	if (nAir == nSensors)
	{
		for (var _id in air)
		{
			values[_id] = aqipm25[_id];		
			labels[_id] = air[_id]['Label'];
			temp[_id] = air[_id]['temp_f'];
		}

		updatedTime = getTimeString();		
	}
}

var currentLatitude = 0;
var currentLongitude = 0;

var locationOK = false;
var logMessage = ""

function locationError(err)
{
	locationOK = false;
	logMessage = err.code + " " + err.message;
}

function locationSuccess(position)
{
	locationOK = true;
	logMessage = "location obtained!";
	
	print(position.coords.latitude)
	print(position.coords.longitude)
	
	currentLatitude = position.coords.latitude;
	currentLongitude = position.coords.longitude;
	
	calculateDistances();
	
	sensors = nearestSensors;
	nSensors = 1;
	air = [];
	values = [];
	labels = [];
	fetchData();
}

function locationCallbackLib(location)
{
	locationOK = true;
	locationData = location;

	print(locationData.latitude)
	print(locationData.longitude)
	print(locationData.accuracy)
	print(locationData.altitude)
	print(locationData.altitudeAccuracy)
	print(locationData.heading)
	print(locationData.speed)
	
	calculateDistances();
	
	sensors = nearestSensors;
	nSensors = 1;
	air = [];
	values = [];
	labels = [];
	fetchData();
}


var closest = [ ];
var nClosest = 1;
var closestIds = [ ];

var nearestSensors = [ ];
var nNearest = 10;
var nearest = [ ];

function calculateDistances()
{
	nearest = [ ];
	
	for (let r = 0; r < sensorTable.getRowCount(); r++) 
	{
		let row = sensorTable.getRow(r);
		let id = row.obj['id'];
		let lon = row.obj['longitude'];
		let lat = row.obj['latitude'];			
//		distance = dist(locationData.longitude, locationData.latitude, lon, lat);		
		distance = calcGeoDistance(currentLongitude, currentLatitude, lon, lat);
		//dist(currentLongitude, currentLatitude, lon, lat);		
		sensorTable.set(r, 'distance', distance);
		
		// print("[ " + r + "] " + distance);
		
	/*	print(closest[0]);
		
		if (closest[0] < 0 || distance < closest[0])
		{
			closest[0] = distance;
			closestIds[0] = id;
			
			print("updated " + id + " " + distance);
		}	
		*/
		/*
		if (closest.length < nClosest)
		{
			closest.push(distance);
			closestIds.push(id);
		}
		else
		{
			for (let i = 0; i < closest.length; i++)
			{
				if (distance < closest[i])
				{
					closest[i] = distance;
					closestIds[i] = id;

					print("updated " + id + " " + distance);

				}
			}
		}*/

		if (nearest.length < nNearest)
		{
			nearest.push([id, distance])
			
			nearest.sort( 
				function compare(a, b)
				{
					if (a[1] > b[1]) return 1;
					if (a[1] < b[1]) return -1;
					
					return 0;
				}
			);
		}
		else
		{
			for (let i = 0; i < nearest.length; i++)
			{
				if (distance < nearest[i][1])
				{
					nearest[i] = [id, distance];

					print("updated " + id + " " + distance);

					break;
				}
			}
		}

	}
	
	nearest.sort( 
				function compare(a, b)
				{
					if (a[1] > b[1]) return 1;
					if (a[1] < b[1]) return -1;
					
					return 0;
				}
			);
		
	for (let i = 0; i < nearest.length; i++)
	{
		nearestSensors.push(nearest[i][0]);
	}
}

var locationOptions = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
};

function setup()
{
	sensorTable.addColumn('distance');
	
	let params = getURLParams();
	
//	print(params);
	
	nParams = Object.keys(params).length;
	
	if (nParams == 0)
	{
		sensors = defaultSensors;
		fetchData();
		print(sensors);
	}
	else
	{
		for (var key in params)
		{
			print(key + " " + params[key]);
			sensors[key] = params[key];
		}
		
		fetchDataMap();
		print(sensorsMap);		
	}
	
	
	
	createCanvas(windowWidth, windowHeight);

	
	navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);
//	getCurrentPosition(locationCallback);
	
		
	textFont(font);
	
}

function reloadCheck()
{
	if (millis() - timeLoaded > timeToRefresh * 1000)
	{
		timeLoaded = millis();
		air = [];
//		fetchDataMap();
		fetchData();
		
	}
}

let colors = [ '#68E143', '#FFFF55', '#EF8533', '#EA3324', '#8C1A4B', '#8C1A4B', '#731425' ];
let mapping = [ 0, 50, 100, 150, 200, 250, 300 ];

updatedTime = 0; 

function getTimeString()
{
	th = hour();
	tm = minute();
	ts = second();
	
	th = th < 10 ? "0" + th : "" + th;
	tm = tm < 10 ? "0" + tm  : "" + tm;
	ts = ts < 10 ? "0" + ts  : "" + ts;
	
	currentTime = th + "." + tm + ":" + ts;
	
	return currentTime; 
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

var buttons = [];

function getLocation(sensorId)
{
	
//	print(sensorId);
	
	row = sensorTable.findRow(sensorId, 'id');
	
//	print(row);
	
	if (row == null)
		return [-1, -1];
	
	lon = row.obj['longitude'];
	lat = row.obj['latitude'];
	
	return [lon, lat];
}

function draw()
{	
	if (nAir != nSensors)
		return;

	currentTime = getTimeString();
	reloadCheck();	
	
	background(255)
	stroke(255);
	line(0, 0, mouseX, mouseY);

	w = width;
	h = height/(nSensors + 1);
		
	let ts = h/3;
	let tx = 10;
	let ty = 10;
	let tdy = ts * 1.5;
	
	textSize(ts);
	fill(255);

	let j = 0;
	
	push();

	textAlign(CENTER);

/*	
	for (var id in values)
	{
		strokeWeight(ts/20);
		stroke(0);
		//text(id + ": " + values[id], tx, ty += tdy);


		value = values[id];
		label = labels[id];//air[id]['Label'];
		//value = 50 * j++; //0, 50, 100, ...
		//value = 10 + j++ * 10; //(10-60)


		colorIndex = int(value/50);
		c0 = colors[colorIndex];
		c1 = colors[colorIndex + 1];
		t = (value % 50) / 50.0;
		
		// c = color(colors[colorIndex]);
		c = lerpColor(color(c0), color(c1), t);
		
		fill(c);

		
		rect(0, 0, w, h);

		stroke(0);
		fill(255);
		strokeWeight(3);

		text(label + " (" + value + ")", w/2, h/2);
		

		translate(0, h);
	}*/

	var k = 0;
		
	buttons = [];

//	v = values;
	
//	if (locationOK)
//		v = sensors;
	
//	for (var id in values)
	for (var i = 0; i < sensors.length; i++)
	{
		let id = sensors[i];
		
		strokeWeight(ts/20);
		stroke(0);
		//text(id + ": " + values[id], tx, ty += tdy);


		value = values[id];
		label = labels[id];//air[id]['Label'];
		//value = 50 * j++; //0, 50, 100, ...
		//value = 10 + j++ * 10; //(10-60)
		fahrenheit = temp[id];

		colorIndex = int(value/50);
		c0 = colors[colorIndex];
		c1 = colors[colorIndex + 1];
		t = (value % 50) / 50.0;
		
		// c = color(colors[colorIndex]);
		c = lerpColor(color(c0), color(c1), t);
		
		fill(c);

		button = new Clickable();

		locationString = "";
		
		if (locationOK)
		{
			row = sensorTable.findRow(id, 'id');
			
			if (row != null)
			{
				let l1 = row.obj['longitude'];
				let l2 = row.obj['latitude'];			
		//		distance = dist(locationData.longitude, locationData.latitude, lon, lat);		
				distance = calcGeoDistance(currentLongitude, currentLatitude, l1, l2);
				distance = parseFloat(distance).toFixed(1)
				locationString = (" [~" + distance + " miles]");
			}
		}
		
		button.x = 0;
		button.y = h * k;
		button.cornerRadius = 0;
		button.strokeWeight = 0;
		button.width = w;
		button.height = h ;
		button.text = label + " (" + value + ", " + fahrenheit + "F)" + locationString;
		button.textScaled = true;
		button.color = c;
		button.textColor = "#FFFFFF";
		button.textSize = 40;
		button.textFont = "Metropolis-Bold";
		
//		labels.push(label);

		buttons.push(button);

		let labelCallback = label;
		let idCallback = id;
		
		loc = getLocation(idCallback)
		
		let urlCallback = "https://www.purpleair.com/map?opt=1/i/mAQI/a10/cC0&select=" + id + "#11.6/" + loc[1] + "/" + loc[0];
		
		buttons[k].onPress = function()
		{
			print(labelCallback);
			window.open(urlCallback, "_self");
//			print(getLocation(idCallback));
		}
		
		buttons[k].draw();
		
		/*
		stroke(0);
		fill(255);
		strokeWeight(3);
*/
		

//		translate(0, h);
		k++;
	}
	
	translate(0, h * k);
	
	textSize(ts/2);
	noStroke();
	fill(220);
	var remaining = int((timeToRefresh * 1000 - (millis() - timeLoaded))/1000);
	text("Updated " + updatedTime  + " (in " + remaining + "s)", w/2, h/2 - ts/2);
	fill(180);
	
	if (locationOK)
	{
		let lat = currentLatitude; //parseFloat(locationData.latitude).toFixed(2);
		let lon = currentLongitude; //parseFloat(locationData.longitude).toFixed(2);
		
		text(currentTime + " [ " + lat + ", " + lon + " ] " + logMessage, w/2, h/2 + ts/2);
	}
	else 
		text(currentTime + " " + logMessage, w/2, h/2 + ts/2);

	
	
/*	
	if (locationData == null)
		text(currentTime, w/2, h/2 + ts/2);
	else
	{
		let lat = parseFloat(locationData.latitude).toFixed(2);
		let lon = parseFloat(locationData.longitude).toFixed(2);
		
		text(currentTime + " [ " + lat + ", " + lon + " ]", w/2, h/2 + ts/2);
	}
*/	
	pop();
}

function mousePressed()
{
	window.navigator.vibrate(1000);
}
