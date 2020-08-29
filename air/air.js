air = [];
dataLoaded = false;
timeToRefresh = 60; //seconds
timeLoaded = 0;
nAir = 0;
nSensors = 0;
values = [];
labels = [];
aqipm25 = [];
font = 0;

var sensors = [];

var defaultSensors = {
	"FQKP8TFDAIDZMXTV": "19633",
	"2KITRCU134L3RYS6": "63169",
	"7ETKDV29585KQXFH": "18495",
	"VRDRK0A6WMO0AHX6": "36991",
	"W02G1W6NS121WGVU": "35029",
	"JTNKAV40HCYEJAUO": "21055"
};

function fetchData() {
	
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
	font = loadFont("fonts/Metropolis-Bold.otf");
}

nBuzzes = 1;
toBuzz = 0;

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
			if (values[_id] != undefined)
			{
				if (values[_id] > 50 && aqipm25[_id] < 50)
					toBuzz = nBuzzes;
			}
			
			if (toBuzz > 0)
			{
//				window.navigator.vibrate(5000);
				toBuzz--;
			}
			
			values[_id] = aqipm25[_id];		
			labels[_id] = air[_id]['Label'];
		}

		updatedTime = getTimeString();		
	}
}

function setup()
{
//	window.navigator.vibrate(10);
	
	let params = getURLParams();
	for (var key in params)
	{
		print(key + " " + params[key]);
		sensors[key] = params[key];
	}
	
	print(sensors);
	
	fetchData();
	
	createCanvas(windowWidth, windowHeight);

	textFont(font);

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
		
	let ts = w/20;
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

		stroke(100);
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
	
}
