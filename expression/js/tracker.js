//wrapper around clmtrackr.js

class FaceTracker
{
	// http://www.digipool.info/m/index.php/File:Clmtrackr-facemodel_numbering.png
	static MOUTH_CORNER_LEFT = 44;
	static MOUTH_UPPER_LEFT = 61;
	static MOUTH_LOWER_LEFT = 56;
	static MOUTH_UPPER_CENTER = 60;
	static MOUTH_LOWER_CENTER = 57;
	static MOUTH_UPPER_RIGHT = 59;
	static MOUTH_LOWER_RIGHT = 58;
	static MOUTH_CORNER_RIGHT = 50;

	static pointsMouth = [ 	FaceTracker.MOUTH_CORNER_LEFT, FaceTracker.MOUTH_UPPER_LEFT, FaceTracker.MOUTH_UPPER_CENTER, 
						   	FaceTracker.MOUTH_UPPER_RIGHT, FaceTracker.MOUTH_CORNER_RIGHT,FaceTracker.MOUTH_LOWER_RIGHT, 
							FaceTracker.MOUTH_LOWER_CENTER, FaceTracker.MOUTH_LOWER_LEFT ];

	static pointsEyeLeft = [ 23, 63, 24, 64, 25, 65, 26, 66 ];
	static pointsEyeRight = [ 30, 68, 29, 67, 28, 70, 31, 69 ];

	constructor()
	{
		this.xy = []; //coordinates for the face feature (based on clmtrackr face model numbering)
		this.bounds = [ -1, -1, -1, -1 ]; //min(x), min(y), max(x), max(y)
		this.opening = 0; //rolling average of mouth opening ratio, relative to the size of the face
		this.openings = new Array(10); //array to track n last mouth openings
		this.openingIndex = 0; //rolling index for updates
	}

	init(width, height)
	{
		this.width = width;
		this.height = height;
		this.camera = this.setupCamera(width, height);
		this.tracker = this.setupTracker(this.camera, pModel); //pModel from clmtrackr.js
	}

	setupCamera(width, height) 
	{
		// Setup camera capture
		let videoInput = createCapture(VIDEO);
		videoInput.size(width, height);
		videoInput.position(0, 0);

		// Mute video
		videoInput.id("videoInput");
		document.getElementById("videoInput").muted = true;
		//videoInput.hide(); 

		return videoInput;
	}

	setupTracker(videoInput, model)
	{
		let ctracker = new clm.tracker();
		ctracker.init(model);
		ctracker.start(videoInput.elt);
	
		return ctracker;
	}

	computeBounds(xy)
	{
		let minX = this.width;
		let minY = this.height;
		let maxX = -1;
		let maxY = -1;

		for (const p of xy)
		{
			if (p[0] > maxX)
				maxX = p[0];
			if (p[1] > maxY)
				maxY = p[1];
			if (p[0] < minX)
				minX = p[0];
			if (p[1] < minY)
				minY = p[1];
		}

		return [ minX, minY, maxX, maxY ];
	}

	computeMouthOpening(xy) 
	{
		let delta = 
			[ xy[FaceTracker.MOUTH_UPPER_LEFT][1] - xy[FaceTracker.MOUTH_LOWER_LEFT][1], 
			  xy[FaceTracker.MOUTH_UPPER_CENTER][1] - xy[FaceTracker.MOUTH_LOWER_CENTER][1], 
			  xy[FaceTracker.MOUTH_UPPER_RIGHT][1] - xy[FaceTracker.MOUTH_LOWER_RIGHT][1] ]
	
		//compute the average of the heights based on 3 lip pairs on either side of the mouth opening
		return abs(delta[0]) + abs(delta[1]) + abs(delta[2])/3;
	}

	update()
	{
		this.xy = this.tracker.getCurrentPosition(); //get all positions

		if (this.xy.length > 0)
		{
			this.bounds = this.computeBounds(this.xy)
			let mouth = this.computeMouthOpening(this.xy);
			let faceHeight = this.bounds[3] - this.bounds[1]; //top-bottom of face
			if (faceHeight == 0)
				this.openings[this.openingIndex] = 0;
			else
				this.openings[this.openingIndex] = mouth/faceHeight; //compute ratio face:mouth

			this.openingIndex = (this.openingIndex + 1) % this.openings.length;

			this.opening = 0;
			for (const o of this.openings)
				this.opening += o/this.openings.length;
		}		
	}

	renderPoints(pointIndices)
	{
		if (this.xy <= 0)
			return;

		for (const i of pointIndices) 
			vertex(this.xy[i][0], this.xy[i][1]);
	}
}
