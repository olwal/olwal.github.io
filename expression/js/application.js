let tracker; //instance of Tracker class (face feature tracking)

//window and camera dimensions
let WIDTH = 800;
let HEIGHT = 600;

//sequence of objects
let sequence = Array(WIDTH/10);
let current = 0;

let doMask = true;
let frameInterval = 5;

let render3d = false;
let use_webgl = false;

//particles with dynamics
class Bubble
{
    static nBubbles = 0; //track total number to create unique ID
    static decayTime = 5000; //how long it can be displayed after instantiation

    constructor(size, x, y)
    {
        //get unique ID and increment static counter
        this.id = Bubble.nBubbles; 
        Bubble.nBubbles++;

        this.size = size; //size [0, 1]
        this.born = millis();
        
        //radius, coordinates, angle
        this.r = (this.size > 0.1 ? this.size : 0) * random(10, 50); //must be > 0.1
        this.x = x;
        this.y = y;
        this.angle = random() * 2 * PI;

        //motion parameters
        this.spin = random(0.5, 1) * PI/60;
        this.divergence = random(25, 40);
        this.growth = random(1.01, 1.02);

        this.shape = random(0, 5);
    }

    render()
    {
        //t = [0, 1] = [born, end of life]
        let t = (millis() - this.born) / Bubble.decayTime;

        if (this.x > width || this.x < 0 || this.y > height || this.y < 0)
            t = 1;

        if (t >= 1)
            return;

        let distance = t * this.divergence; //expanding radius
        this.angle += this.spin; //spinning
        this.r *= this.growth; //increasing size
        
        //updated coordinates based on new distance and spun angle 
        this.x += distance * cos(this.angle); 
        this.y += distance * sin(this.angle);

        //oscillate hue 200+/-10 using sinusoid(t)
        let hue = 200 + 10 * sin((1-t) * 5 * PI);

        let r = this.r; // * 1 + 0.2 * sin((1-t) * 2 * PI);

        //2D rendering of elipses (pseudo-3d)
        if (!render3d)
        {
            noStroke();
            fill(hue, (1-t) * 255, 100); //opacity: (1-t) * 100
            ellipseMode(CENTER);        
            ellipse(this.x, this.y, r, r);
        }
        //3D rendering using Web GL
        else
        {
            stroke(hue, (1-t) * 255, 100); //opacity: (1-t) * 50
            noFill();
            push();
                translate(this.x, this.y, this.distance);
                rotateX(frameCount * 0.1);
                rotateY(frameCount * 0.1);

                strokeWeight(2);

                switch(int(this.shape))
                {
                    case 0: sphere(r, 5, 5); break;
                    case 1: box(r); break;
                    case 2: cylinder(r, r*2, 15, 15); break;
                    case 3: cone(r, r*2, 15, 15); break;
                    case 4: torus(r, r/2, 10, 10); break;
                }

            pop();
        }
    }
}

function setup() 
{
    randomSeed();
    tracker = new FaceTracker();
    tracker.init(WIDTH, HEIGHT);

    if (use_webgl)
        canvas = createCanvas(WIDTH, HEIGHT, WEBGL);
    else
        canvas = createCanvas(WIDTH, HEIGHT);

    canvas.position(0,0);

    rectMode(CORNERS);
    colorMode(HSB);

    background(0);
}
      
function draw() 
{
    clear();

    //let t = (frameCount % 100)/100;
    //40 + 20 * sin(t * 2 * PI);

    //cover the canvas with a solid rectangle with cutout for eyes and mouth
    if (doMask)
    {
        //adjust hue and saturation based on how much mouth is opened
        let hue = 200 + tracker.opening * 10; 
        let saturation = 10 + tracker.opening * 100;
        let brightness = 100;
        
        fill(hue, saturation, brightness, 255);
        beginShape();

            vertex(0, 0);
            vertex(0, height);
            vertex(width, height);
            vertex(width, 0);

            //cutout mouth, and eyes
            if (tracker.xy.length > 0)
            {
                beginContour();
                tracker.renderPoints(FaceTracker.pointsMouth);
                endContour();

                beginContour();
                tracker.renderPoints(FaceTracker.pointsEyeLeft);
                endContour();

                beginContour();
                tracker.renderPoints(FaceTracker.pointsEyeRight);
                endContour();
            }

        endShape(CLOSE);
    }

    // outline of the face
//    ellipseMode(CORNERS);
//    b = tracker.bounds;
//    ellipse(b[0], b[1], b[2], b[3]); 

    push();
        if (use_webgl)
            translate(-width/2, -height/2); //if using WEB_GL

        tracker.update(); //run face tracking and compute mouth opening

        //spawn bubbles every frameInterval-th frame
        if ((frameCount % frameInterval) == 0) 
        {
            let positionMouth = tracker.xy[FaceTracker.MOUTH_LOWER_CENTER]
            if (positionMouth)
                sequence[current] = new Bubble(tracker.opening, positionMouth[0], positionMouth[1]);
        }

        //render all the bubbles
        for (let x = 0; x < sequence.length; x++)
        {
            let bubble = sequence[ (current + x + 1) % sequence.length ];
            if (bubble == undefined)
                continue;
            else
            {
                bubble.render();   
                v = bubble.r * height / 2;
                //line(x, height, x, height - v);
            }
        }

        //update index
        current = (current + 1) % sequence.length;

    pop();
}