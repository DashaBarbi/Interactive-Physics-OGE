var momentumAnim = null;
var momentumState = {
    ball1: { x: 150, m: 3, v: 5, r: 26 },
    ball2: { x: 550, m: 2, v: 0, r: 24 },
    collided: false,
    stuck: false,
    time: 0
};


var requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            return window.setTimeout(callback, 1000 / 60);
        };
})();

var cancelAnimFrame = (function () {
    return window.cancelAnimationFrame ||
        window.webkitCancelAnimationFrame ||
        window.mozCancelAnimationFrame ||
        window.oCancelAnimationFrame ||
        window.msCancelAnimationFrame ||
        function (id) {
            window.clearTimeout(id);
        };
})();


function initMomentum() {
    var canvas = document.getElementById('momentum-canvas');
    if (!canvas) return;

    var container = canvas.parentElement;

    canvas.width = container.clientWidth - 48;
    canvas.height = 300;

    resetMomentum();

    var sliderIds = ['m1', 'v1', 'm2', 'v2'];
    for (var i = 0; i < sliderIds.length; i++) {
        (function (id) {
            var slider = document.getElementById(id);
            if (slider) {
                slider.oninput = function () {
                    var valEl = document.getElementById(id + '-val');
                    if (valEl) valEl.textContent = this.value;
                    updateMomentumBalls();
                };
                slider.onchange = function () {
                    var valEl = document.getElementById(id + '-val');
                    if (valEl) valEl.textContent = this.value;
                    updateMomentumBalls();
                };
            }
        })(sliderIds[i]);
    }


    var resizeTimeout;
    window.onresize = function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function () {
            canvas.width = container.clientWidth - 48;
            resetMomentum();
        }, 100);
    };
}


function calculateBallPositions() {
    var canvas = document.getElementById('momentum-canvas');
    var width = canvas.width;
    var center = width / 2;

    var m1El = document.getElementById('m1');
    var m2El = document.getElementById('m2');

    var m1 = m1El ? parseFloat(m1El.value) : 3;
    var m2 = m2El ? parseFloat(m2El.value) : 2;
    var r1 = 20 + m1 * 2;
    var r2 = 20 + m2 * 2;


    var gap = 200;

    var ball1X = center - gap / 2 - r1;
    var ball2X = center + gap / 2 + r2;

    return { ball1X: ball1X, ball2X: ball2X, r1: r1, r2: r2, m1: m1, m2: m2 };
}


function updateMomentumBalls() {
    var pos = calculateBallPositions();

    var v1El = document.getElementById('v1');
    var v2El = document.getElementById('v2');

    momentumState.ball1.m = pos.m1;
    momentumState.ball1.v = v1El ? parseFloat(v1El.value) : 5;
    momentumState.ball1.r = pos.r1;
    momentumState.ball1.x = pos.ball1X;

    momentumState.ball2.m = pos.m2;
    momentumState.ball2.v = v2El ? parseFloat(v2El.value) : 0;
    momentumState.ball2.r = pos.r2;
    momentumState.ball2.x = pos.ball2X;

    momentumState.collided = false;
    momentumState.stuck = false;

    drawMomentum();
}

function resetMomentum() {
    if (momentumAnim) {
        cancelAnimFrame(momentumAnim);
        momentumAnim = null;
    }

    var pos = calculateBallPositions();
    var v1El = document.getElementById('v1');
    var v2El = document.getElementById('v2');


    momentumState = {
        ball1: {
            x: pos.ball1X,
            m: pos.m1,
            v: v1El ? parseFloat(v1El.value) : 5,
            r: pos.r1
        },
        ball2: {
            x: pos.ball2X,
            m: pos.m2,
            v: v2El ? parseFloat(v2El.value) : 0,
            r: pos.r2
        },
        collided: false,
        stuck: false,
        time: 0
    };

    var resultIds = ['p-before', 'p-after', 'v1-after', 'v2-after'];
    for (var i = 0; i < resultIds.length; i++) {
        var el = document.getElementById(resultIds[i]);
        if (el) el.textContent = '—';
    }

    drawMomentum();
}


function startMomentum() {
    if (momentumAnim) return;

    resetMomentum();

    var typeEl = document.getElementById('collision-type');
    var type = typeEl ? typeEl.value : 'inelastic';
    var ball1 = momentumState.ball1;
    var ball2 = momentumState.ball2;

    var pBefore = ball1.m * ball1.v + ball2.m * ball2.v;
    var pBeforeEl = document.getElementById('p-before');
    if (pBeforeEl) pBeforeEl.textContent = pBefore.toFixed(2) + ' кг·м/с';

    animateMomentum(type);
}

function animateMomentum(type) {
    var canvas = document.getElementById('momentum-canvas');
    var ball1 = momentumState.ball1;
    var ball2 = momentumState.ball2;
    var dt = 0.016;
    var scale = 25;

    momentumState.time += dt;

    if (momentumState.stuck) {
        var vCommon = ball1.v;
        ball1.x += vCommon * scale * dt;
        ball2.x = ball1.x + ball1.r + ball2.r;
    } else {
        ball1.x += ball1.v * scale * dt;
        ball2.x += ball2.v * scale * dt;
    }


    if (!momentumState.collided) {
        var distance = ball2.x - ball1.x;
        var minDistance = ball1.r + ball2.r;

        if (distance <= minDistance) {
            momentumState.collided = true;

            var contactPoint = (ball1.x + ball2.x) / 2;
            ball1.x = contactPoint - ball1.r;
            ball2.x = contactPoint + ball2.r;

            if (type === 'inelastic') {
                var vf = (ball1.m * ball1.v + ball2.m * ball2.v) / (ball1.m + ball2.m);
                ball1.v = vf;
                ball2.v = vf;
                momentumState.stuck = true;
            } else {
                var v1f = ((ball1.m - ball2.m) * ball1.v + 2 * ball2.m * ball2.v) / (ball1.m + ball2.m);
                var v2f = ((ball2.m - ball1.m) * ball2.v + 2 * ball1.m * ball1.v) / (ball1.m + ball2.m);
                ball1.v = v1f;
                ball2.v = v2f;
            }

            var pAfter = ball1.m * ball1.v + ball2.m * ball2.v;
            var pAfterEl = document.getElementById('p-after');
            var v1AfterEl = document.getElementById('v1-after');
            var v2AfterEl = document.getElementById('v2-after');

            if (pAfterEl) pAfterEl.textContent = pAfter.toFixed(2) + ' кг·м/с';
            if (v1AfterEl) v1AfterEl.textContent = ball1.v.toFixed(2) + ' м/с';
            if (v2AfterEl) v2AfterEl.textContent = ball2.v.toFixed(2) + ' м/с';
        }
    }


    drawMomentum();

    if (Math.abs(ball1.v) > 0.01 || Math.abs(ball2.v) > 0.01) {
        momentumAnim = requestAnimFrame(function () {
            animateMomentum(type);
        });
    } else {
        momentumAnim = null;
    }
}

// Отрисовка шаров
function drawMomentum() {
    var canvas = document.getElementById('momentum-canvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var ball1 = momentumState.ball1;
    var ball2 = momentumState.ball2;
    var floorY = canvas.height - 50;

    // Очистка
    ctx.fillStyle = '#1a1b1dff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Пол
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(canvas.width, floorY);
    ctx.stroke();

    // Шар 1 (синий)
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(ball1.x, floorY - ball1.r, ball1.r, 0, Math.PI * 2);
    ctx.fill();

    // Подпись шара 1
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('m1=' + ball1.m + 'кг', ball1.x, floorY - ball1.r * 2 - 10);

    // Стрелка скорости шара 1
    if (Math.abs(ball1.v) > 0.1) {
        drawArrow(ctx, ball1.x, floorY - ball1.r - 50, ball1.x + ball1.v * 8, floorY - ball1.r - 50, '#3b82f6');
    }

    // Шар 2 (красный)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(ball2.x, floorY - ball2.r, ball2.r, 0, Math.PI * 2);
    ctx.fill();

    // Подпись шара 2
    ctx.fillStyle = '#fff';
    ctx.fillText('m2=' + ball2.m + 'кг', ball2.x, floorY - ball2.r * 2 - 10);

    // Стрелка скорости шара 2
    if (Math.abs(ball2.v) > 0.1) {
        drawArrow(ctx, ball2.x, floorY - ball2.r - 50, ball2.x + ball2.v * 8, floorY - ball2.r - 50, '#ef4444');
    }
}


function drawArrow(ctx, fromX, fromY, toX, toY, color) {
    var headLen = 10;
    var dx = toX - fromX;
    var dy = toY - fromY;
    var angle = Math.atan2(dy, dx);

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}

if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', function () {
        initMomentum();
    });
} else if (document.attachEvent) {
    document.attachEvent('onreadystatechange', function () {
        if (document.readyState === 'complete') {
            initMomentum();
        }
    });
}


if (window.addEventListener) {
    window.addEventListener('load', function () {
        if (!momentumState.ball1.x) initMomentum();
    });
} else if (window.attachEvent) {
    window.attachEvent('onload', function () {
        if (!momentumState.ball1.x) initMomentum();
    });
}