// ==========================================
// ЭЛЕКТРИЧЕСКИЕ ЦЕПИ
// Кроссбраузерная версия (IE11+, Chrome, Firefox, Safari, Edge)
// ==========================================

var circuitElements = [];
var selectedElement = null;
var emf = 12;
var circuitCurrent = 0;
var animationPhase = 0;

var elementTypes = {
    battery: { name: 'Источник', resistance: 0, symbol: 'E' },
    resistor: { name: 'Резистор', resistance: 10, symbol: 'R' },
    lamp: { name: 'Лампа', resistance: 20, symbol: '💡' },
    switch_el: { name: 'Ключ', resistance: 0, closed: true, symbol: 'K' },
    ammeter: { name: 'Амперметр', resistance: 0.01, symbol: 'A' },
    voltmeter: { name: 'Вольтметр', resistance: 10000, symbol: 'V' },
    wire: { name: 'Провод', resistance: 0, symbol: '—' }
};

function initCircuits() {
    var canvas = document.getElementById('circuit-canvas');
    if (!canvas) return;

    var emfSlider = document.getElementById('emf');
    if (emfSlider) {
        emfSlider.oninput = emfSlider.onchange = function() {
            emf = parseFloat(this.value);
            var valEl = document.getElementById('emf-val');
            if (valEl) valEl.textContent = emf;
            calculateCircuit();
            drawCircuit();
        };
    }

    var elemRSlider = document.getElementById('elem-r');
    if (elemRSlider) {
        elemRSlider.oninput = elemRSlider.onchange = function() {
            if (selectedElement && selectedElement.type !== 'battery') {
                selectedElement.resistance = parseFloat(this.value);
                var valEl = document.getElementById('elem-r-val');
                if (valEl) valEl.textContent = this.value;
                calculateCircuit();
                drawCircuit();
            }
        };
    }

    canvas.onclick = function(e) {
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        selectedElement = null;
        for (var i = 0; i < circuitElements.length; i++) {
            var el = circuitElements[i];
            if (x >= el.x - 30 && x <= el.x + 30 && y >= el.y - 20 && y <= el.y + 20) {
                selectedElement = el;

                if (el.type === 'switch_el') {
                    el.closed = !el.closed;
                    calculateCircuit();
                }

                showElementParams(el);
                break;
            }
        }

        var paramsPanel = document.getElementById('element-params');
        if (!selectedElement && paramsPanel) {
            paramsPanel.style.display = 'none';
        }

        drawCircuit();
    };

    loadPreset('series');

    setInterval(function() {
        animationPhase += 0.1;
        if (circuitCurrent > 0) {
            drawCircuit();
        }
    }, 50);
}

function showElementParams(el) {
    var panel = document.getElementById('element-params');
    if (!panel) return;
    
    panel.style.display = 'block';

    var elemREl = document.getElementById('elem-r');
    var elemRValEl = document.getElementById('elem-r-val');
    var elemUEl = document.getElementById('elem-u');
    var elemIEl = document.getElementById('elem-i');

    if (elemREl) elemREl.value = el.resistance;
    if (elemRValEl) elemRValEl.textContent = el.resistance;
    if (elemUEl) elemUEl.textContent = (el.voltage || 0).toFixed(2);
    if (elemIEl) elemIEl.textContent = (el.current || 0).toFixed(3);
}

function loadPreset(type) {
    circuitElements = [];

    if (type === 'series') {
        circuitElements = [
            { type: 'battery', x: 150, y: 150, resistance: 0, emf: emf },
            { type: 'switch_el', x: 300, y: 150, resistance: 0, closed: true },
            { type: 'resistor', x: 450, y: 150, resistance: 10 },
            { type: 'lamp', x: 550, y: 250, resistance: 20 },
            { type: 'ammeter', x: 450, y: 350, resistance: 0.01 },
            { type: 'resistor', x: 300, y: 350, resistance: 15 },
            { type: 'wire', x: 150, y: 250, resistance: 0 }
        ];
    } else if (type === 'parallel') {
        circuitElements = [
            { type: 'battery', x: 100, y: 250, resistance: 0, emf: emf },
            { type: 'switch_el', x: 200, y: 150, resistance: 0, closed: true },
            { type: 'resistor', x: 350, y: 150, resistance: 10 },
            { type: 'resistor', x: 350, y: 350, resistance: 20 },
            { type: 'ammeter', x: 500, y: 250, resistance: 0.01 },
            { type: 'lamp', x: 600, y: 250, resistance: 30 }
        ];
    } else if (type === 'mixed') {
        circuitElements = [
            { type: 'battery', x: 100, y: 250, resistance: 0, emf: emf },
            { type: 'switch_el', x: 200, y: 250, resistance: 0, closed: true },
            { type: 'resistor', x: 350, y: 150, resistance: 10 },
            { type: 'lamp', x: 500, y: 150, resistance: 15 },
            { type: 'resistor', x: 350, y: 350, resistance: 20 },
            { type: 'ammeter', x: 600, y: 250, resistance: 0.01 }
        ];
    }

    calculateCircuit();
    drawCircuit();
    drawEquivalent();
}

function clearCircuit() {
    circuitElements = [];
    circuitCurrent = 0;
    selectedElement = null;
    
    var paramsPanel = document.getElementById('element-params');
    if (paramsPanel) paramsPanel.style.display = 'none';
    
    var totalREl = document.getElementById('total-r');
    var totalIEl = document.getElementById('total-i');
    if (totalREl) totalREl.textContent = '0';
    if (totalIEl) totalIEl.textContent = '0';
    
    drawCircuit();
    drawEquivalent();
}

function calculateCircuit() {
    var switchClosed = true;
    var totalR = 0;

    for (var i = 0; i < circuitElements.length; i++) {
        var el = circuitElements[i];
        if (el.type === 'switch_el' && !el.closed) {
            switchClosed = false;
        }
        if (el.type !== 'battery' && el.type !== 'voltmeter') {
            totalR += el.resistance;
        }
    }

    if (!switchClosed || totalR === 0 || circuitElements.length === 0) {
        circuitCurrent = 0;
    } else {
        circuitCurrent = emf / totalR;
    }

    for (var i = 0; i < circuitElements.length; i++) {
        var el = circuitElements[i];
        if (el.type === 'voltmeter') {
            el.current = 0;
            el.voltage = emf;
        } else {
            el.current = circuitCurrent;
            el.voltage = circuitCurrent * el.resistance;
        }
    }

    var totalREl = document.getElementById('total-r');
    var totalIEl = document.getElementById('total-i');
    if (totalREl) totalREl.textContent = totalR.toFixed(1);
    if (totalIEl) totalIEl.textContent = circuitCurrent.toFixed(3);
}

function drawCircuit() {
    var canvas = document.getElementById('circuit-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    var x, y;
    for (x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    if (circuitElements.length === 0) {
        ctx.fillStyle = '#64748b';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Выберите готовую схему', canvas.width / 2, canvas.height / 2);
        return;
    }

    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 3;

    for (var i = 0; i < circuitElements.length; i++) {
        var el = circuitElements[i];
        var next = circuitElements[(i + 1) % circuitElements.length];

        ctx.beginPath();
        ctx.moveTo(el.x + 30, el.y);
        ctx.lineTo(next.x - 30, next.y);
        ctx.stroke();
    }

    if (circuitCurrent > 0) {
        ctx.fillStyle = '#fbbf24';
        for (var i = 0; i < circuitElements.length; i++) {
            var el = circuitElements[i];
            var next = circuitElements[(i + 1) % circuitElements.length];

            var dx = next.x - el.x;
            var dy = next.y - el.y;

            for (var j = 0; j < 3; j++) {
                var t = ((animationPhase + j * 0.3) % 1);
                var px = el.x + 30 + (dx - 60) * t;
                var py = el.y + dy * t;

                ctx.beginPath();
                ctx.arc(px, py, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    for (var i = 0; i < circuitElements.length; i++) {
        drawElement(ctx, circuitElements[i], circuitElements[i] === selectedElement);
    }
}

function drawElement(ctx, el, selected) {
    var x = el.x;
    var y = el.y;

    if (selected) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 35, y - 25, 70, 50);
    }

    ctx.lineWidth = 2;

    if (el.type === 'battery') {
        ctx.strokeStyle = '#22c55e';
        ctx.beginPath();
        ctx.moveTo(x - 20, y - 15);
        ctx.lineTo(x - 20, y + 15);
        ctx.stroke();

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x - 10, y - 8);
        ctx.lineTo(x - 10, y + 8);
        ctx.stroke();

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(emf + 'В', x + 15, y + 5);
        ctx.fillText('+', x - 10, y - 12);
        ctx.fillText('-', x - 20, y - 12);
    }
    else if (el.type === 'resistor') {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 25, y);
        for (var i = 0; i < 6; i++) {
            ctx.lineTo(x - 20 + i * 8, y + (i % 2 === 0 ? -8 : 8));
        }
        ctx.lineTo(x + 25, y);
        ctx.stroke();

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(el.resistance + 'Ом', x, y + 25);
    }
    else if (el.type === 'lamp') {
        var brightness = circuitCurrent > 0 ? Math.min(1, circuitCurrent / 0.5) : 0;

        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.strokeStyle = '#fbbf24';
        ctx.stroke();

        if (brightness > 0) {
            ctx.fillStyle = 'rgba(251, 191, 36, ' + brightness + ')';
            ctx.fill();
        }

        ctx.beginPath();
        ctx.moveTo(x - 8, y - 8);
        ctx.lineTo(x + 8, y + 8);
        ctx.moveTo(x + 8, y - 8);
        ctx.lineTo(x - 8, y + 8);
        ctx.stroke();
    }
    else if (el.type === 'switch_el') {
        ctx.strokeStyle = el.closed ? '#22c55e' : '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x - 15, y, 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + 15, y, 5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x - 10, y);
        if (el.closed) {
            ctx.lineTo(x + 10, y);
        } else {
            ctx.lineTo(x + 5, y - 15);
        }
        ctx.stroke();

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(el.closed ? 'ВКЛ' : 'ВЫКЛ', x, y + 25);
    }
    else if (el.type === 'ammeter') {
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#1e293b';
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('A', x, y + 5);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '10px Arial';
        ctx.fillText((el.current || 0).toFixed(2) + 'А', x, y + 35);
    }
    else if (el.type === 'voltmeter') {
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#1e293b';
        ctx.fill();

        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('V', x, y + 5);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '10px Arial';
        ctx.fillText((el.voltage || 0).toFixed(1) + 'В', x, y + 35);
    }
    else if (el.type === 'wire') {
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 25, y);
        ctx.lineTo(x + 25, y);
        ctx.stroke();
    }
}

function drawEquivalent() {
    var canvas = document.getElementById('equivalent-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var totalR = 0;
    for (var i = 0; i < circuitElements.length; i++) {
        if (circuitElements[i].type !== 'battery' && circuitElements[i].type !== 'voltmeter') {
            totalR += circuitElements[i].resistance;
        }
    }

    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(50, 75);
    ctx.lineTo(50, 40);
    ctx.lineTo(250, 40);
    ctx.lineTo(250, 75);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(50, 75);
    ctx.lineTo(50, 110);
    ctx.lineTo(250, 110);
    ctx.lineTo(250, 75);
    ctx.stroke();

    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 60);
    ctx.lineTo(50, 90);
    ctx.stroke();

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(60, 65);
    ctx.lineTo(60, 85);
    ctx.stroke();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(220, 75);
    for (var i = 0; i < 4; i++) {
        ctx.lineTo(225 + i * 6, 75 + (i % 2 === 0 ? -6 : 6));
    }
    ctx.lineTo(250, 75);
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('E = ' + emf + ' В', 55, 130);
    ctx.fillText('R = ' + totalR.toFixed(1) + ' Ом', 235, 130);
    ctx.fillText('I = ' + circuitCurrent.toFixed(3) + ' А', 150, 75);
}

// Автоматический запуск
if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', function() {
        if (document.getElementById('circuit-canvas')) {
            initCircuits();
        }
    });
} else if (document.attachEvent) {
    document.attachEvent('onreadystatechange', function() {
        if (document.readyState === 'complete') {
            if (document.getElementById('circuit-canvas')) {
                initCircuits();
            }
        }
    });
}