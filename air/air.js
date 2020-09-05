air = [];
dataLoaded = false;
timeToRefresh = 10; //seconds
timeLoaded = 0;
nAir = 0;
nSensors = 0;
values = [];
labels = [];
aqipm25 = [];
font = 0;

var sensors = [];
var sensorsMap = [];

// 19633&A=28299&J=46475&K=21449&D=44911&D=60163&G=5642&R=15883&S=60231

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
	
	nSensors = len(sensors);
		
	for (var i = 0; i < nSensors; i++)
	{
		let url = "https://www.purpleair.com/json?show=" + sensors[i];
		print(url);		
		i++;			
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

function preload() {
//	fetchData();
//	font = loadFont("fonts/Roboto-Bold.ttf");
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
		}

		updatedTime = getTimeString();		
	}
}

function setup()
{
	let params = getURLParams();
	
	nParams = Object.keys(params).length;
	
	if (nParams == 0)
		sensors = defaultSensors;
	else
	{
		for (var key in params)
		{
			print(key + " " + params[key]);
			sensorsMap[key] = params[key];
			sensors.push(key);
		}
	}
	
	print(sensors);
	
	fetchData();
	
	createCanvas(windowWidth, windowHeight);

//	textFont(font);

}

function reloadCheck()
{
	if (millis() - timeLoaded > timeToRefresh * 1000)
	{
		timeLoaded = millis();
		air = [];
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
	}
		
	textSize(ts/2);
	noStroke();
	fill(220);
	text("Updated " + updatedTime, w/2, h/2 - ts/2);
	fill(180);
	text(currentTime, w/2, h/2 + ts/2);
	
	pop();
}

function mousePressed()
{
	window.navigator.vibrate(1000);
}
