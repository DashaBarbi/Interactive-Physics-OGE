var animationId = null;
var running = false;

var ball = {
    x: 0,
    y: 0,
    vx: 0,
    radius: 15
};

var params = {
    mass: 1,
    height: 5,
    gravity: 9.8,
    friction: 0
};

var energyData = {
    potential: 0,
    kinetic: 0,
    heat: 0,
    total: 0,
    initial: 0
};

var SCALE = 25;
var FLOOR_Y = 280;
var RAMP_WIDTH = 200;
var LEFT_START = 80;


var requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) {
            return window.setTimeout(callback, 1000 / 60);
        };
})();

var cancelAnimFrame = (function() {
    return window.cancelAnimationFrame ||
        window.webkitCancelAnimationFrame ||
        window.mozCancelAnimationFrame ||
        window.oCancelAnimationFrame ||
        window.msCancelAnimationFrame ||
        function(id) {
            window.clearTimeout(id);
        };
})();

function getRampY(x) {
    var rampHeight = params.height * SCALE;
    var flatStart = LEFT_START + RAMP_WIDTH;
    var flatEnd = flatStart + 100;
    var rightEnd = flatEnd + RAMP_WIDTH;

    if (x <= LEFT_START) {
        return FLOOR_Y - rampHeight;
    }
    if (x <= flatStart) {
        var t = (x - LEFT_START) / RAMP_WIDTH;
        return (FLOOR_Y - rampHeight) + rampHeight * t * t;
    }
    if (x <= flatEnd) {
        return FLOOR_Y;
    }
    if (x <= rightEnd) {
        var t = 1 - (x - flatEnd) / RAMP_WIDTH;
        return (FLOOR_Y - rampHeight) + rampHeight * t * t;
    }
    return FLOOR_Y - rampHeight;
}

function getRampSlope(x) {
    var rampHeight = params.height * SCALE;
    var flatStart = LEFT_START + RAMP_WIDTH;
    var flatEnd = flatStart + 100;
    var rightEnd = flatEnd + RAMP_WIDTH;

    if (x <= LEFT_START) return 0;
    if (x <= flatStart) {
        var t = (x - LEFT_START) / RAMP_WIDTH;
        return 2 * rampHeight * t / RAMP_WIDTH;
    }
    if (x <= flatEnd) return 0;
    if (x <= rightEnd) {
        var t = 1 - (x - flatEnd) / RAMP_WIDTH;
        return -2 * rampHeight * t / RAMP_WIDTH;
    }
    return 0;
}

function resetEnergy() {
    if (animationId) {
        cancelAnimFrame(animationId);
        animationId = null;
    }
    running = false;

    var massEl = document.getElementById('ball-mass');
    var heightEl = document.getElementById('ball-height');
    var frictionEl = document.getElementById('friction');
    var planetEl = document.getElementById('planet');

    params.mass = massEl ? parseFloat(massEl.value) : 1;
    params.height = heightEl ? parseFloat(heightEl.value) : 5;
    params.friction = frictionEl ? parseFloat(frictionEl.value) : 0;
    params.gravity = planetEl ? parseFloat(planetEl.value) : 9.8;

    ball.x = LEFT_START;
    ball.y = getRampY(ball.x) - ball.radius;
    ball.vx = 0;

    energyData.initial = params.mass * params.gravity * params.height;
    energyData.potential = energyData.initial;
    energyData.kinetic = 0;
    energyData.heat = 0;
    energyData.total = energyData.initial;

    drawScene();
    updateEnergyBars();
}

function startEnergy() {
    if (running) return;

    var massEl = document.getElementById('ball-mass');
    var heightEl = document.getElementById('ball-height');
    var frictionEl = document.getElementById('friction');
    var planetEl = document.getElementById('planet');

    params.mass = massEl ? parseFloat(massEl.value) : 1;
    params.height = heightEl ? parseFloat(heightEl.value) : 5;
    params.friction = frictionEl ? parseFloat(frictionEl.value) : 0;
    params.gravity = planetEl ? parseFloat(planetEl.value) : 9.8;

    ball.x = LEFT_START;
    ball.y = getRampY(ball.x) - ball.radius;
    ball.vx = 0.5;

    energyData.initial = params.mass * params.gravity * params.height;
    energyData.heat = 0;

    running = true;
    animateScene();
}

function animateScene() {
    if (!running) return;

    var dt = 0.018;
    var slope = getRampSlope(ball.x);
    var angle = Math.atan(slope);
    var cosAngle = Math.cos(angle);
    var sinAngle = Math.sin(angle);

    var gravityForce = params.gravity * SCALE * sinAngle;
    var frictionAccel = params.friction * params.gravity * SCALE * cosAngle;
    var accel = gravityForce;

    if (ball.vx > 0.1) {
        accel -= frictionAccel;
    } else if (ball.vx < -0.1) {
        accel += frictionAccel;
    } else {
        if (frictionAccel > Math.abs(gravityForce)) {
            accel = 0;
            ball.vx = 0;
        }
    }

    ball.vx += accel * dt;

    var distance = Math.abs(ball.vx * dt);
    var frictionWork = params.friction * params.mass * params.gravity * cosAngle * distance / SCALE;
    energyData.heat += frictionWork;

    if (energyData.heat > energyData.initial) {
        energyData.heat = energyData.initial;
    }

    ball.x += ball.vx * dt;

    var minX = LEFT_START;
    var maxX = LEFT_START + RAMP_WIDTH * 2 + 100;

    if (ball.x <= minX) {
        ball.x = minX;
        ball.vx = Math.abs(ball.vx) * 0.95;
    }
    if (ball.x >= maxX) {
        ball.x = maxX;
        ball.vx = -Math.abs(ball.vx) * 0.95;
    }

    ball.y = getRampY(ball.x) - ball.radius;

    var currentHeight = Math.max(0, (FLOOR_Y - ball.y - ball.radius) / SCALE);
    var velocity = Math.abs(ball.vx) / SCALE;

    energyData.potential = params.mass * params.gravity * currentHeight;
    energyData.kinetic = 0.5 * params.mass * velocity * velocity;
    energyData.total = energyData.initial - energyData.heat;

    drawScene();
    updateEnergyBars();

    var isFlat = Math.abs(slope) < 0.01;
    var isStopped = Math.abs(ball.vx) < 0.3;

    if (isStopped && isFlat && params.friction > 0) {
        ball.vx = 0;
        running = false;
        animationId = null;
        drawScene();
        updateEnergyBars();
        return;
    }

    if (energyData.total < 0.1 && params.friction > 0) {
        ball.vx = 0;
        running = false;
        animationId = null;
        drawScene();
        updateEnergyBars();
        return;
    }

    animationId = requestAnimFrame(animateScene);
}

function drawScene() {
    var canvas = document.getElementById('energy-canvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var rampHeight = params.height * SCALE;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    var gx, gy;
    for (gx = 0; gx < canvas.width; gx += 50) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, canvas.height);
        ctx.stroke();
    }
    for (gy = 0; gy < canvas.height; gy += 50) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(canvas.width, gy);
        ctx.stroke();
    }

    ctx.fillStyle = 'rgba(71, 85, 105, 0.5)';
    ctx.beginPath();
    ctx.moveTo(30, FLOOR_Y - rampHeight);

    var x;
    for (x = 30; x <= 650; x += 3) {
        ctx.lineTo(x, getRampY(x));
    }

    ctx.lineTo(650, canvas.height);
    ctx.lineTo(30, canvas.height);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(30, FLOOR_Y - rampHeight);

    for (x = 30; x <= 650; x += 3) {
        ctx.lineTo(x, getRampY(x));
    }
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('h = ' + params.height.toFixed(1) + ' м', 10, FLOOR_Y - rampHeight + 15);
    ctx.fillText('h = 0', 330, FLOOR_Y + 20);


    ctx.fillStyle = '#e00d0d';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    var planetEl = document.getElementById('planet');
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    if (planetEl && planetEl.options && planetEl.selectedIndex >= 0) {
        ctx.fillText(planetEl.options[planetEl.selectedIndex].text, 10, 20);
    }
    ctx.fillText('m = ' + params.mass.toFixed(1) + ' кг', 10, 40);
    ctx.fillText('μ = ' + params.friction.toFixed(2), 10, 60);

    var velocity = Math.abs(ball.vx) / SCALE;
    var currentHeight = Math.max(0, (FLOOR_Y - ball.y - ball.radius) / SCALE);

    ctx.textAlign = 'right';
    ctx.fillText('v = ' + velocity.toFixed(2) + ' м/с', canvas.width - 10, 20);
    ctx.fillText('h = ' + currentHeight.toFixed(2) + ' м', canvas.width - 10, 40);

    if (params.friction > 0) {
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('Q = ' + energyData.heat.toFixed(1) + ' Дж', canvas.width - 10, 60);
    }
}

function updateEnergyBars() {
    var maxE = energyData.initial || 1;

    var epBar = document.getElementById('ep-bar');
    var ekBar = document.getElementById('ek-bar');
    var eBar = document.getElementById('e-bar');

    if (epBar) epBar.style.width = Math.min(100, energyData.potential / maxE * 100) + '%';
    if (ekBar) ekBar.style.width = Math.min(100, energyData.kinetic / maxE * 100) + '%';
    if (eBar) eBar.style.width = Math.min(100, energyData.total / maxE * 100) + '%';

    var epValue = document.getElementById('ep-value');
    var ekValue = document.getElementById('ek-value');
    var eValue = document.getElementById('e-value');

    if (epValue) epValue.textContent = energyData.potential.toFixed(1) + ' Дж';
    if (ekValue) ekValue.textContent = energyData.kinetic.toFixed(1) + ' Дж';
    if (eValue) eValue.textContent = energyData.total.toFixed(1) + ' Дж';
}

function initSliders() {
    var massEl = document.getElementById('ball-mass');
    if (massEl) {
        massEl.oninput = massEl.onchange = function() {
            params.mass = parseFloat(this.value);
            var valEl = document.getElementById('ball-mass-val');
            if (valEl) valEl.textContent = this.value;
            if (!running) resetEnergy();
        };
    }

    var heightEl = document.getElementById('ball-height');
    if (heightEl) {
        heightEl.oninput = heightEl.onchange = function() {
            params.height = parseFloat(this.value);
            var valEl = document.getElementById('ball-height-val');
            if (valEl) valEl.textContent = this.value;
            if (!running) resetEnergy();
        };
    }

    var frictionEl = document.getElementById('friction');
    if (frictionEl) {
        frictionEl.oninput = frictionEl.onchange = function() {
            params.friction = parseFloat(this.value);
            var valEl = document.getElementById('friction-val');
            if (valEl) valEl.textContent = this.value;
        };
    }

    var planetEl = document.getElementById('planet');
    if (planetEl) {
        planetEl.onchange = function() {
            params.gravity = parseFloat(this.value);
            if (!running) resetEnergy();
        };
    }
}

if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', function() {
        initSliders();
        resetEnergy();
    });
} else if (document.attachEvent) {
    document.attachEvent('onreadystatechange', function() {
        if (document.readyState === 'complete') {
            initSliders();
            resetEnergy();
        }
    });
}

window.onload = function() {
    initSliders();
    resetEnergy();
};