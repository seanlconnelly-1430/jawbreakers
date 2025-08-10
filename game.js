var canvas;
var context;
var acceleration;
var decceleration;
var rotationRate;
var maxshipSpeed;
var blasts = [];
var score;
var asteroidSpeedFactor;
var drawRate;
var blastDistance;
var particleDistance;
var blastLimit;
var ship = null;
var asteroids = [];
var extraLives;
var shipColor = 'green';
var particles = [];
var shotsFired;
var hits;
var percentage;
var shipImage = new Image();
shipImage.src = "SpaceShip.png";
// Handle image loading error
shipImage.onerror = function() {
    console.log("SpaceShip.png not found, using fallback drawing");
};

window.onload = function () {
    canvas = document.getElementById("drawingCanvas");
    context = canvas.getContext("2d");
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);           
    document.getElementById("newGame").onclick = function () {
        document.getElementById("newGame").blur();
        newGame();                
    };
    drawFrame();
};

function newGame() {
    asteroids = [];
    particles = [];
    acceleration = 0.075 * 1.25;
    decceleration = 0.075 / 6;
    rotationRate = 0.03490656;
    maxshipSpeed = 3.00;
    minShipSpeed = 0.25;
    blasts = [];
    score = 0;
    asteroidSpeedFactor = 0.5;
    drawRate = 10.00;
    blastDistance = 500;
    particleDistance = 100;
    blastLimit = 10;
    score = 0;
    extraLives = 2;
    ship = null;
    ship = NewShip();
    shotsFired = 0;
    hits = 0;
    percentage = 0;

    document.getElementById("extraLives").innerText = extraLives;
    document.getElementById("score").innerText = score;
    document.getElementById("shotsFired").innerText = shotsFired;
    document.getElementById("hits").innerText = hits;
    document.getElementById("percentage").innerText = "";            
    document.getElementById("gameStatus").innerText = "";
    document.getElementById("drawingCanvas").focus();

    if (document.getElementById("justFly").checked == false) {
        addAsteroidsToGame();
        addAsteroidsToGame();
    }
}

function GameOver() {            
    blasts = [];
    ship = null;
    document.getElementById("gameStatus").innerText = "Game Over!";
}

function UpdateLives() {
    extraLives = extraLives - 1;
    if (extraLives >= 0) {
        document.getElementById("extraLives").innerText = extraLives;
    }            
}

function UpdateShotMetrics() {
    document.getElementById("hits").innerText = hits;            
    document.getElementById("shotsFired").innerText = shotsFired;
    if (hits > 0) {
        percentage = hits / shotsFired;
        document.getElementById("percentage").innerText = Math.round(percentage * 100) + '%';
    }
}
function NewShip() {
    return new Ship(canvas.width / 2, canvas.height / 2, 0, 0, 20, shipColor);
}

function Particle(x, y, dx, dy, r, color, index, md) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.slope = dx / dy;
    this.r = r;
    this.index = index;
    this.fillColor = color;
    this.m = Math.PI * (r * r);
    this.distance = 0;
    this.maxDistance = md;
    this.draw = function (c) {
        this.distance = this.distance + 5;
        if (this.x > canvas.width) { this.x = 1; }
        if (this.x < 0) { this.x = canvas.width; }
        if (this.y > canvas.height) { this.y = 1; }
        if (this.y < 0) { this.y = canvas.height; }
        this.x += this.dx;
        this.y += this.dy;
        // draw the blast
        c.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        c.lineWidth = 1;
        c.strokeStyle = "black";
        c.fillStyle = this.fillColor;
        c.fill();
        c.stroke();
        if (this.distance > this.maxDistance) {
            this.remove();
        }
    };
    this.remove = function () {
        particles.splice(this.index, 1);
        for (var i = 0; i < particles.length; i++) {
            particles[i].index = particles[i].index - 1;
        }
    };
};

function Blast(x, y, dx, dy, r, color, a, index, md) {            
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.slope = dx / dy;
    this.r = r;
    this.a = a;
    this.index = index;
    this.fillColor = color;
    this.m = Math.PI * (r * r);
    this.distance = 0;
    this.maxDistance = md;
    this.draw = function (c) {
        this.distance = this.distance + 5;
        if (this.x > canvas.width) { this.x = 1; }
        if (this.x < 0) { this.x = canvas.width; }
        if (this.y > canvas.height) { this.y = 1; }
        if (this.y < 0) { this.y = canvas.height; }

        this.x += this.dx * Math.cos(this.a);
        this.y += this.dy * Math.sin(this.a);
        // draw the blast
        c.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        c.lineWidth = 1;
        c.strokeStyle = "red";
        c.fillStyle = this.fillColor;
        c.fill();
        c.stroke();
        if (this.distance > this.maxDistance) {
            this.remove();
        }
    };
    this.remove = function () {
        blasts.splice(this.index, 1);
        for (var i = 0; i < blasts.length; i++) {
            blasts[i].index = blasts[i].index - 1;
        }
    };
};

function Ship(x, y, dx, dy, r, color) {
    this.t = 0;
    this.a = 0;
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.tdx = 0;
    this.tdy = 0;
    this.slope = dx / dy;
    this.r = r;
    this.rotation = 0;
    this.rotationDirection;
    this.firing = false;
    this.fillColor = color;
    this.m = Math.PI * (r * r);
    this.setFire = function (x) {
        this.firing = x;
    };
    this.spawn = function () {   
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.dx = 0;
        this.dy = 0;
    };
    this.fire = function () {
        if (blasts.length <= blastLimit) {
            var color = 'yellow';
            // get the size
            var r = 1;
            // create blast
            var blast = new Blast(ship.x, ship.y, 6, 6, 2, color, ship.rotation, blasts.length, blastDistance);
            // add to array
            blasts.push(blast);                    
        }
    };
    this.hit = function () {
        console.log("ship hit...");
        this.explode();                
        ship = null;
    };
    this.explode = function () {
        for (var p = 0; p < 50; p++) {
            addParticle(this.x, this.y, 2, 'red', getMaxDistance(300));
        }
    };
    this.thrustOn = function () {
        this.a = this.rotation;
        this.t = 1;
        this.tdx = this.dx;
        this.tdy = this.dy;
    };
    this.thrustOff = function () {
        this.a = this.rotation;
        this.t = 0;
    };
    this.setRotateRight = function (x) {
        if(x)
            this.rotationDirection = 1;
        else
            this.rotationDirection = 0
    };
    this.setRotateLeft = function (x) {
        if(x)
            this.rotationDirection = -1;
        else
            this.rotationDirection = 0;
    };
    this.draw = function (c) {
        var x = this.x;
        var y = this.y;
        var r = this.r;
        var rotation = this.rotation;
        var a = this.a;
                 
        if (this.rotationDirection == 1) { this.rotation = this.rotation + rotationRate; }
        if (this.rotationDirection == -1) { this.rotation = this.rotation - rotationRate; }

        if (Math.abs(this.rotation) >= Math.PI * 2) {
            this.rotation = 0;
        }

        if (this.t == 1) {
            a = rotation;
            if (this.dx <= maxshipSpeed && this.dy <= maxshipSpeed) {
                this.dx = this.dx + acceleration;
                this.dy = this.dy + acceleration;
            }
        }
        if (this.t == 0) {
            if (this.dx > minShipSpeed && this.dy > minShipSpeed) {
                this.dx = this.dx - decceleration;
                this.dy = this.dy - decceleration;
            }
        }

        if (this.dx > 0 && this.dy > 0) {
            x = x + this.dx * Math.cos(a);
            y = y + this.dy * Math.sin(a);
            this.x = x;
            this.y = y;
            if (this.t == 1) {
                // ship thrust            
            }
        }

        if (x > canvas.width) { this.x = 1; }
        if (x < 0) { this.x = canvas.width; }
        if (y > canvas.height) { this.y = 1; }
        if (y < 0) { this.y = canvas.height; }

        // ship body
        c.save();
        c.translate(x, y);
        c.rotate(this.rotation);
        
        // Check if image is loaded and not broken
        if (shipImage.complete && shipImage.naturalWidth !== 0) {
            c.drawImage(shipImage, -(shipImage.width / 2), -(shipImage.height / 2));
        } else {
            // Fallback: draw a simple triangle ship
            c.beginPath();
            c.moveTo(0, -this.r);
            c.lineTo(-this.r/2, this.r/2);
            c.lineTo(this.r/2, this.r/2);
            c.closePath();
            c.fillStyle = this.fillColor;
            c.fill();
            c.strokeStyle = "black";
            c.lineWidth = 2;
            c.stroke();
        }
        
        c.restore();               
    }
}

function Asteroid(x, y, dx, dy, r, color) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.slope = dx / dy;
    this.r = r;
    this.fillColor = color;
    this.m = Math.PI * (r * r);
    this.draw = function (c) {
        if (this.x > canvas.width) { this.x = 1; }
        if (this.x < 0) { this.x = canvas.width; }
        if (this.y > canvas.height) { this.y = 1; }
        if (this.y < 0) { this.y = canvas.height; }
        this.x += this.dx;
        this.y += this.dy;
        c.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        c.lineWidth = 1;
        c.strokeStyle = "black";
        c.fillStyle = this.fillColor;
        c.fill();
        c.stroke();
    };
    this.hit = function (index) {
        score = score + Math.floor(this.r);
        document.getElementById("score").innerText = score;
        var r = this.r / 2.5;
        asteroids.splice(index, 1);
        if (r >= 7) {
            for (var i = 0; i < 3; i++) {
                //console.log("add asteroid with r=" + r);                
                addAsteroids(r, this.x, this.y);
            }                    
        }
        for (var p = 0; p < 5; p++) {
            addParticle(this.x, this.y, 1, 'white', getMaxDistance(particleDistance));
        }
        if (asteroids.length == 0) {
            setTimeout(function () {
                addAsteroidsToGame();
                addAsteroidsToGame();
            }, 3000);
        }
    };
}

function addAsteroids(r, x, y) {
    // create asteroid
    var asteroid = new Asteroid(x, y, getDX(), getDY(), r, getColor());
    // add to array
    asteroids.push(asteroid);
    //console.log("adding asteroid...");
}

function addAsteroidsToGame() {
    var pointAtLeftOrRightOfCanvas = Math.random() > .5 ? canvas.width : 0;
    var pointAtTopOrBottomOfCanvas = Math.random() > .5 ? canvas.height : 0;
    var pointAlongXAxis = Math.floor((Math.random() * canvas.width) + 1);
    var pointAlongYAxis = Math.floor((Math.random() * canvas.height) + 1);
    addAsteroids(45, pointAtLeftOrRightOfCanvas, pointAlongYAxis);
    addAsteroids(45, pointAlongXAxis, pointAtTopOrBottomOfCanvas);
}

function getMaxDistance(md) {
    return Math.random() * md + md;
}

function addParticle(x, y, r, c, md) {            
    var particle = new Particle(x, y, getDX(), getDY(), r, c, particles.length, md);
    particles.push(particle);
}

function drawFrame() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.beginPath();
    if (ship != null) {
        ship.draw(context);
    }
    context.lineWidth = 1;
    context.fill();
    context.stroke();

    for (var i = 0; i < blasts.length; i++) {
        context.beginPath();
        var blast = blasts[i];
        blast.draw(context);
    }

    for (var i = 0; i < asteroids.length; i++) {
        context.beginPath();
        var asteroid = asteroids[i];
        asteroid.draw(context);
    }

    for (var i = 0; i < particles.length; i++) {
        context.beginPath();
        var particle = particles[i];
        particle.draw(context);
    }

    for (var a = 0; a < asteroids.length; a++) {                
        var asteroid = asteroids[a];
        // check for hit by blast
        for (var b = 0; b < blasts.length; b++) {
            var blast = blasts[b];
            if ((Math.abs(blast.x - asteroid.x) < Math.abs(blast.r + asteroid.r)) &&
                (Math.abs(blast.y - asteroid.y) < Math.abs(blast.r + asteroid.r))) {
                // its a hit
                blast.remove();
                asteroid.hit(a);
                hits += 1;
                UpdateShotMetrics();                        
                break;
            }
        }
        if (ship != null) {
            // check for hit on ship
            if ((Math.abs(ship.x - asteroid.x) < Math.abs((ship.r / 2) + asteroid.r)) &&
                (Math.abs(ship.y - asteroid.y) < Math.abs((ship.r / 2) + asteroid.r))) {
                ship.hit();
                UpdateLives();
                if (extraLives < 0) {
                    GameOver();
                    break;
                }
                setTimeout(function () { ship = NewShip() }, 3000);
                break;
            }
        }
    }

    setTimeout(drawFrame, drawRate);
}

function getColor() {
    var r = Math.floor((Math.random() * 255) + 1);
    var g = Math.floor((Math.random() * 255) + 1);
    var b = Math.floor((Math.random() * 255) + 1);
    var x = "rgb(" + r + "," + g + "," + b + ")";
    return x;
}

function getDX() {
    var a = getRandomAngle();
    return Math.cos(a);
}

function getDY() {
    var a = getRandomAngle();
    return Math.sin(a);
}
    
function getRandomAngle() {
    return Math.random() * Math.PI * 2;
}

function onKeyDown(event) {
    if (ship != null) {

        switch (event.keyCode) {
            case 38:
                // up arrow            
                //console.log('up arrow');
                ship.thrustOn();
                break;
            case 37:
                // left arrow
                //console.log('left arrow');
                ship.setRotateLeft(true);
                break;
            case 39:
                // right arrow
                //console.log('right arrow');                    
                ship.setRotateRight(true);
                break;
            case 32:
                // space bar
                //console.log('pew..pew..');
                //ship.setFire(true);                    
                ship.fire();
                shotsFired += 1;
                UpdateShotMetrics();
                break;
        }
        console.log('ship.a ' + ship.a);
    }
}

function onKeyUp(event) {
    if (ship != null) {
        switch (event.keyCode) {
            case 38:
                // up arrow             
                //console.log('up arrow key up');
                ship.thrustOff();
                break;
            case 37:
                // left arrow 
                ship.setRotateLeft(false);
                break;
            case 39:
                // right arrow            
                ship.setRotateRight(false);
                break;
            case 32:
                // space bar
                //ship.setFire(false);
                break;
        }
    }
} 