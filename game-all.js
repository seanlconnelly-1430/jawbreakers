// Cache DOM elements for better performance
var canvas, context;
var acceleration, decceleration, rotationRate, maxshipSpeed, minShipSpeed;
var blasts = [];
var score = 0;
var asteroidSpeedFactor;
var drawRate;
var blastDistance;
var particleDistance;
var blastLimit;
var ship = null;
var asteroids = [];
var extraLives = 2;
var shipColor = 'blue';
var particles = [];
var shotsFired = 0;
var hits = 0;
var percentage = 0;

// Cache DOM elements to avoid repeated getElementById calls
var extraLivesElement, scoreElement, shotsFiredElement, hitsElement, percentageElement, gameStatusElement, drawingCanvasElement, justFlyElement;

// Pre-calculate constants
var PI = Math.PI;
var PI2 = PI * 2;
var HALF_PI = PI / 2;

// Remove unused shipImage since this version uses canvas drawing

window.onload = function () {
    // Cache DOM elements once
    canvas = document.getElementById("drawingCanvas");
    context = canvas.getContext("2d");
    extraLivesElement = document.getElementById("extraLives");
    scoreElement = document.getElementById("score");
    shotsFiredElement = document.getElementById("shotsFired");
    hitsElement = document.getElementById("hits");
    percentageElement = document.getElementById("percentage");
    gameStatusElement = document.getElementById("gameStatus");
    drawingCanvasElement = document.getElementById("drawingCanvas");
    justFlyElement = document.getElementById("justFly");
    
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);           
    document.getElementById("newGame").onclick = function () {
        document.getElementById("newGame").blur();
        newGame();                
    };
    drawFrame();
};

function newGame() {
    // Clear arrays more efficiently
    asteroids.length = 0;
    particles.length = 0;
    blasts.length = 0;
    
    // Game constants
    acceleration = 0.075 * 1.25;
    decceleration = 0.075 / 6;
    rotationRate = 0.03490656;
    maxshipSpeed = 3.00;
    minShipSpeed = 0.25;
    asteroidSpeedFactor = 0.5;
    drawRate = 10.00;
    blastDistance = 500;
    particleDistance = 100;
    blastLimit = 10;
    
    // Reset game state
    score = 0;
    extraLives = 2;
    ship = NewShip();
    shotsFired = 0;
    hits = 0;
    percentage = 0;

    // Update UI using cached elements
    extraLivesElement.innerHTML = extraLives;
    scoreElement.innerHTML = score;
    shotsFiredElement.innerHTML = shotsFired;
    hitsElement.innerHTML = hits;
    percentageElement.innerHTML = "";
    gameStatusElement.innerHTML = "";
    drawingCanvasElement.focus();

    if (!justFlyElement.checked) {
        addAsteroidsToGame();
        addAsteroidsToGame();
    }
}

function GameOver() {            
    blasts.length = 0;
    ship = null;
    gameStatusElement.innerText = "Game Over!";
}

function UpdateLives() {
    extraLives--;
    if (extraLives >= 0) {
        extraLivesElement.innerText = extraLives;
    }            
}

function UpdateShotMetrics() {
    hitsElement.innerHTML = hits;
    shotsFiredElement.innerHTML = shotsFired;
    if (hits > 0) {
        percentage = hits / shotsFired;
        percentageElement.innerHTML = Math.round(percentage * 100) + '%';
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
    this.r = r;
    this.index = index;
    this.fillColor = color;
    this.distance = 0;
    this.maxDistance = md;
    
    this.draw = function (c) {
        this.distance += 5;
        
        // Wrap around screen edges
        if (this.x > canvas.width) { this.x = 1; }
        if (this.x < 0) { this.x = canvas.width; }
        if (this.y > canvas.height) { this.y = 1; }
        if (this.y < 0) { this.y = canvas.height; }
        
        this.x += this.dx;
        this.y += this.dy;
        
        // Draw particle
        c.beginPath();
        c.arc(this.x, this.y, this.r, 0, PI2);
        c.lineWidth = 1;
        c.strokeStyle = this.fillColor;
        c.fillStyle = this.fillColor;
        c.fill();
        c.stroke();
        
        if (this.distance > this.maxDistance) {
            this.remove();
        }
    };
    
    this.remove = function () {
        // Mark for removal instead of immediate removal
        this.markedForRemoval = true;
    };
};

function Blast(x, y, dx, dy, r, color, a, index, md) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.r = r;
    this.a = a;
    this.index = index;
    this.fillColor = color;
    this.distance = 0;
    this.maxDistance = md;
    
    this.draw = function (c) {
        this.distance += 5;
        
        // Wrap around screen edges
        if (this.x > canvas.width) { this.x = 1; }
        if (this.x < 0) { this.x = canvas.width; }
        if (this.y > canvas.height) { this.y = 1; }
        if (this.y < 0) { this.y = canvas.height; }

        this.x += this.dx * Math.cos(this.a);
        this.y += this.dy * Math.sin(this.a);
        
        // Draw blast
        c.beginPath();
        c.arc(this.x, this.y, this.r, 0, PI2);
        c.lineWidth = 1;
        c.strokeStyle = this.fillColor;
        c.fillStyle = this.fillColor;
        c.fill();
        c.stroke();
        
        if (this.distance > this.maxDistance) {
            this.remove();
        }
    };
    
    this.remove = function () {
        // Mark for removal instead of immediate removal
        this.markedForRemoval = true;
    };
};

function Ship(x, y, dx, dy, r, color) {
    this.t = 0;
    this.a = 0;
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.r = r;
    this.rotation = 0;
    this.rotationDirection = 0;
    this.fillColor = color;
    
    this.fire = function () {
        if (blasts.length < blastLimit) {
            var blast = new Blast(this.x, this.y, 6, 6, 2, 'red', this.rotation, blasts.length, blastDistance);
            blasts.push(blast);                    
        }
    };
    
    this.hit = function () {
        this.explode();                
        ship = null;
    };
    
    this.explode = function () {
        var colors = ['red', 'yellow', 'orange'];
        for (var p = 0; p < 50; p++) {
            var randomColor = colors[Math.floor(Math.random() * colors.length)];
            addParticle(this.x, this.y, 2, randomColor, getMaxDistance(300));
        }
    };
    
    this.thrustOn = function () {
        this.a = this.rotation;
        this.t = 1;
    };
    
    this.thrustOff = function () {
        this.t = 0;
    };
    
    this.setRotateRight = function (x) {
        this.rotationDirection = x ? 1 : 0;
    };
    
    this.setRotateLeft = function (x) {
        this.rotationDirection = x ? -1 : 0;
    };
    this.draw = function (c) {
        var x = this.x;
        var y = this.y;
        var r = this.r;
        var rotation = this.rotation;
        var a = this.a;
                 
        // Update rotation
        if (this.rotationDirection === 1) { 
            this.rotation += rotationRate; 
        } else if (this.rotationDirection === -1) { 
            this.rotation -= rotationRate; 
        }

        // Normalize rotation
        if (Math.abs(this.rotation) >= PI2) {
            this.rotation = 0;
        }

        // Update velocity based on thrust
        if (this.t === 1) {
            a = rotation;
            if (this.dx <= maxshipSpeed && this.dy <= maxshipSpeed) {
                this.dx += acceleration;
                this.dy += acceleration;
            }
        } else if (this.t === 0) {
            if (this.dx > minShipSpeed && this.dy > minShipSpeed) {
                this.dx -= decceleration;
                this.dy -= decceleration;
            }
        }

        // Update position
        if (this.dx > 0 && this.dy > 0) {
            x += this.dx * Math.cos(a);
            y += this.dy * Math.sin(a);
            this.x = x;
            this.y = y;
            
            // Draw thrust effect
            if (this.t === 1) {
                c.beginPath();
                c.moveTo(x, y);
                c.lineTo(x + (r / 2) * Math.cos(a), y + (r / 2) * Math.sin(a));
                c.lineTo(x - (r / 2) * Math.cos(a), y - (r / 2) * Math.sin(a));
                c.lineWidth = 5;
                c.strokeStyle = 'red';
                c.stroke();
            }
        }

        // Wrap around screen edges
        if (x > canvas.width) { this.x = 1; }
        if (x < 0) { this.x = canvas.width; }
        if (y > canvas.height) { this.y = 1; }
        if (y < 0) { this.y = canvas.height; }

        // Draw ship body                
        c.beginPath();
        c.strokeStyle = 'black';
        c.lineWidth = 1;
        c.moveTo(x, y);       
        c.lineTo(x + (r / 2) * Math.cos(rotation + 77), y + (r / 2) * Math.sin(rotation + 77));
        c.lineTo(x + r * Math.cos(rotation), y + r * Math.sin(rotation));
        c.lineTo(x - (r / 2) * Math.cos(rotation + 77), y - (r / 2) * Math.sin(rotation + 77));
        c.closePath();
        c.fillStyle = 'green';
        c.fill();
        c.stroke();                
    }
}

function Asteroid(x, y, dx, dy, r, color) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.r = r;
    this.fillColor = color;
    
    this.draw = function (c) {
        // Wrap around screen edges
        if (this.x > canvas.width) { this.x = 1; }
        if (this.x < 0) { this.x = canvas.width; }
        if (this.y > canvas.height) { this.y = 1; }
        if (this.y < 0) { this.y = canvas.height; }
        
        this.x += this.dx;
        this.y += this.dy;
        
        c.beginPath();
        c.arc(this.x, this.y, this.r, 0, PI2);
        c.lineWidth = 1;
        c.strokeStyle = this.fillColor;
        c.fillStyle = this.fillColor;
        c.fill();
        c.stroke();
    };
    
    this.hit = function (index) {
        score += Math.floor(this.r);
        scoreElement.innerHTML = score;
        
        var newRadius = this.r / 2.5;
        
        // Mark for removal instead of immediate removal
        this.markedForRemoval = true;
        
        // Create smaller asteroids if large enough
        if (newRadius >= 7) {
            for (var i = 0; i < 3; i++) {
                addAsteroids(newRadius, this.x, this.y);
            }                    
        }
        
        // Create explosion particles
        for (var p = 0; p < 5; p++) {
            addParticle(this.x, this.y, 1, 'white', getMaxDistance(particleDistance));
        }
    };
}

function addAsteroids(r, x, y) {
    asteroids.push(new Asteroid(x, y, getDX(), getDY(), r, getColor()));
}

function addAsteroidsToGame() {
    var pointAtLeftOrRightOfCanvas = Math.random() > 0.5 ? canvas.width : 0;
    var pointAtTopOrBottomOfCanvas = Math.random() > 0.5 ? canvas.height : 0;
    var pointAlongXAxis = Math.floor(Math.random() * canvas.width) + 1;
    var pointAlongYAxis = Math.floor(Math.random() * canvas.height) + 1;
    addAsteroids(45, pointAtLeftOrRightOfCanvas, pointAlongYAxis);
    addAsteroids(45, pointAlongXAxis, pointAtTopOrBottomOfCanvas);
}

function getMaxDistance(md) {
    return Math.random() * md + md;
}

function addParticle(x, y, r, c, md) {            
    particles.push(new Particle(x, y, getDX(), getDY(), r, c, particles.length, md));
}

function drawFrame() {
    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw ship
    if (ship !== null) {
        ship.draw(context);
    }

    // Draw all game objects
    var i, len;
    
    // Draw blasts
    for (i = 0, len = blasts.length; i < len; i++) {
        if (blasts[i]) {
            blasts[i].draw(context);
        }
    }

    // Draw asteroids
    for (i = 0, len = asteroids.length; i < len; i++) {
        if (asteroids[i]) {
            asteroids[i].draw(context);
        }
    }

    // Draw particles
    for (i = 0, len = particles.length; i < len; i++) {
        if (particles[i]) {
            particles[i].draw(context);
        }
    }

    // Collision detection
    for (var a = 0, aLen = asteroids.length; a < aLen; a++) {                
        var asteroid = asteroids[a];
        if (!asteroid || asteroid.markedForRemoval) continue;
        
        // Check blast hits on asteroids
        for (var b = 0, bLen = blasts.length; b < bLen; b++) {
            var blast = blasts[b];
            if (!blast || blast.markedForRemoval) continue;
            
            if (hit(blast.x, blast.y, blast.r, asteroid.x, asteroid.y, asteroid.r)) {
                blast.remove();
                asteroid.hit(a);
                hits++;
                UpdateShotMetrics();
                break;
            }
        }
        
        // Check ship collision with asteroid
        if (ship !== null && !asteroid.markedForRemoval) {
            if (hit(ship.x, ship.y, ship.r, asteroid.x, asteroid.y, asteroid.r)) {
                ship.hit();
                UpdateLives();
                if (extraLives < 0) {
                    GameOver();
                    break;
                }
                setTimeout(function () { ship = NewShip(); }, 3000);
                break;
            }
        }
    }

    // Clean up marked objects after collision detection
    // Remove marked particles
    for (var i = particles.length - 1; i >= 0; i--) {
        if (particles[i] && particles[i].markedForRemoval) {
            particles.splice(i, 1);
        }
    }
    
    // Remove marked blasts
    for (var i = blasts.length - 1; i >= 0; i--) {
        if (blasts[i] && blasts[i].markedForRemoval) {
            blasts.splice(i, 1);
        }
    }
    
    // Remove marked asteroids and check if we need to spawn new ones
    var asteroidsRemoved = false;
    for (var i = asteroids.length - 1; i >= 0; i--) {
        if (asteroids[i] && asteroids[i].markedForRemoval) {
            asteroids.splice(i, 1);
            asteroidsRemoved = true;
        }
    }
    
    // If asteroids were removed and none remain, spawn new ones
    if (asteroidsRemoved && asteroids.length === 0) {
        setTimeout(function () {
            addAsteroidsToGame();
            addAsteroidsToGame();
        }, 3000);
    }

    setTimeout(drawFrame, drawRate);
}

function hit(p1x, p1y, p1r, p2x, p2y, p2r){
	var dx = p1x - p2x;
	var dy = p1y - p2y;
	var distance = Math.sqrt(dx * dx + dy * dy);
	return distance < (p1r + p2r);
}

function getColor() {
    return "rgb(" + Math.floor(Math.random() * 255) + "," + 
                   Math.floor(Math.random() * 255) + "," + 
                   Math.floor(Math.random() * 255) + ")";
}

function getDX() {
    return Math.cos(getRandomAngle());
}

function getDY() {
    return Math.sin(getRandomAngle());
}
    
function getRandomAngle() {
    return Math.random() * PI2;
}

function onKeyDown(event) {
    if (ship !== null) {
        switch (event.keyCode) {
            case 38: // up arrow
                ship.thrustOn();
                break;
            case 37: // left arrow
                ship.setRotateLeft(true);
                break;
            case 39: // right arrow
                ship.setRotateRight(true);
                break;
            case 32: // space bar
                ship.fire();
                shotsFired++;
                UpdateShotMetrics();
                break;
        }
    }
}

function onKeyUp(event) {
    if (ship !== null) {
        switch (event.keyCode) {
            case 38: // up arrow
                ship.thrustOff();
                break;
            case 37: // left arrow
                ship.setRotateLeft(false);
                break;
            case 39: // right arrow
                ship.setRotateRight(false);
                break;
        }
    }
} 