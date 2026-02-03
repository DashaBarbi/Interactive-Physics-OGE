// ==========================================
// ОТРАЖЕНИЕ И ПРЕЛОМЛЕНИЕ
// Кроссбраузерная версия (IE11+, Chrome, Firefox, Safari, Edge)
// ==========================================

var currentRefractionTask = 0;

// Вспомогательная функция drawArrow
function drawArrow(ctx, fromX, fromY, toX, toY, color) {
    var headLen = 10;
    var dx = toX - fromX;
    var dy = toY - fromY;
    var angle = Math.atan2(dy, dx);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}

function initRefraction() {
    updateRefraction();
    
    var elementIds = ['incident-angle', 'medium1', 'medium2', 'show-normal', 'show-angles'];
    
    for (var i = 0; i < elementIds.length; i++) {
        (function(id) {
            var el = document.getElementById(id);
            if (el) {
                el.oninput = el.onchange = function() {
                    var valEl = document.getElementById(id + '-val');
                    if (valEl) {
                        valEl.textContent = this.value;
                    }
                    updateRefraction();
                };
            }
        })(elementIds[i]);
    }
}

function updateRefraction() {
    var angleEl = document.getElementById('incident-angle');
    var medium1El = document.getElementById('medium1');
    var medium2El = document.getElementById('medium2');
    
    var alpha = angleEl ? parseFloat(angleEl.value) : 45;
    var n1 = medium1El ? parseFloat(medium1El.value) : 1.0;
    var n2 = medium2El ? parseFloat(medium2El.value) : 1.5;
    
    var beta = alpha; // Угол отражения = углу падения
    var sinGamma = (n1 / n2) * Math.sin(alpha * Math.PI / 180);
    
    var gamma, totalReflection = false;
    if (sinGamma > 1) {
        totalReflection = true;
        gamma = 90;
    } else {
        gamma = Math.asin(sinGamma) * 180 / Math.PI;
    }
    
    var angleIncidentEl = document.getElementById('angle-incident');
    var angleReflectionEl = document.getElementById('angle-reflection');
    var angleRefractionEl = document.getElementById('angle-refraction');
    var relativeNEl = document.getElementById('relative-n');
    var totalReflectionEl = document.getElementById('total-reflection');
    
    if (angleIncidentEl) angleIncidentEl.textContent = alpha + '°';
    if (angleReflectionEl) angleReflectionEl.textContent = beta + '°';
    if (angleRefractionEl) angleRefractionEl.textContent = totalReflection ? 'Полное отражение' : gamma.toFixed(1) + '°';
    if (relativeNEl) relativeNEl.textContent = (n2 / n1).toFixed(2);
    if (totalReflectionEl) totalReflectionEl.style.display = totalReflection ? 'block' : 'none';
    
    drawRefraction(alpha, beta, gamma, n1, n2, totalReflection);
}

function drawRefraction(alpha, beta, gamma, n1, n2, totalReflection) {
    var canvas = document.getElementById('refraction-canvas');
    if (!canvas) return;
    
    var ctx = canvas.getContext('2d');
    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;
    
    var showNormalEl = document.getElementById('show-normal');
    var showAnglesEl = document.getElementById('show-angles');
    var showNormal = showNormalEl ? showNormalEl.checked : true;
    var showAngles = showAnglesEl ? showAnglesEl.checked : true;
    
    // Очистка canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Среда 1 (верх)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.77)';
    ctx.fillRect(0, 0, canvas.width, centerY);
    ctx.fillStyle = 'rgba(28, 78, 143, 0.81)';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText('Среда 1: n1 = ' + n1, 20, 30);
    
    // Среда 2 (низ)
    ctx.fillStyle = 'rgba(28, 78, 143, 0.81)';
    ctx.fillRect(0, centerY, canvas.width, canvas.height - centerY);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.77)';
    ctx.fillText('Среда 2: n2 = ' + n2, 20, centerY + 30);
    
    // Граница раздела сред
    ctx.strokeStyle = '#363f49ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();
    
    // Нормаль (пунктирная линия)
    if (showNormal) {
        ctx.strokeStyle = '#000000ff';
        ctx.lineWidth = 1;
        
        // Пунктир вручную для IE
        var dashLen = 5;
        var gapLen = 5;
        var y = 20;
        while (y < canvas.height - 20) {
            ctx.beginPath();
            ctx.moveTo(centerX, y);
            ctx.lineTo(centerX, Math.min(y + dashLen, canvas.height - 20));
            ctx.stroke();
            y += dashLen + gapLen;
        }
        
        ctx.fillStyle = '#000000ff';
        ctx.font = '12px Arial, sans-serif';
        ctx.fillText('нормаль', centerX + 5, 40);
    }
    
    var rayLength = 150;
    var alphaRad = alpha * Math.PI / 180;
    var betaRad = beta * Math.PI / 180;
    var gammaRad = gamma * Math.PI / 180;
    
    // ПАДАЮЩИЙ ЛУЧ (жёлтый)
    var incStartX = centerX - rayLength * Math.sin(alphaRad);
    var incStartY = centerY - rayLength * Math.cos(alphaRad);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(incStartX, incStartY);
    ctx.lineTo(centerX, centerY);
    ctx.stroke();
    
    // Стрелка на падающем луче
    drawArrow(ctx, incStartX + 50 * Math.sin(alphaRad), incStartY + 50 * Math.cos(alphaRad), 
              incStartX + 70 * Math.sin(alphaRad), incStartY + 70 * Math.cos(alphaRad), '#f59e0b');
    
    // ОТРАЖЁННЫЙ ЛУЧ (красный)
    var refEndX = centerX + rayLength * Math.sin(betaRad);
    var refEndY = centerY - rayLength * Math.cos(betaRad);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(refEndX, refEndY);
    ctx.stroke();
    
    // ПРЕЛОМЛЁННЫЙ ЛУЧ (зелёный)
    if (!totalReflection) {
        var transEndX = centerX + rayLength * Math.sin(gammaRad);
        var transEndY = centerY + rayLength * Math.cos(gammaRad);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(transEndX, transEndY);
        ctx.stroke();
    }
    
    // Отображение углов (дуги)
    if (showAngles) {
        // Угол падения α
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 40, -Math.PI / 2 - alphaRad, -Math.PI / 2);
        ctx.stroke();
        ctx.fillStyle = '#f59e0b';
        ctx.font = '12px monospace';
        ctx.fillText('α=' + alpha + '°', centerX - 70, centerY - 50);
        
        // Угол отражения β
        ctx.strokeStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 50, -Math.PI / 2, -Math.PI / 2 + betaRad);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.fillText('β=' + beta + '°', centerX + 30, centerY - 60);
        
        // Угол преломления γ
        if (!totalReflection) {
            ctx.strokeStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 40, Math.PI / 2 - gammaRad, Math.PI / 2);
            ctx.stroke();
            ctx.fillStyle = '#10b981';
            ctx.fillText('γ=' + gamma.toFixed(0) + '°', centerX + 5, centerY + 60);
        }
    }
    
    // Легенда
    ctx.font = '12px Arial, sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('● Падающий луч', canvas.width - 140, 30);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('● Отражённый луч', canvas.width - 140, 50);
    ctx.fillStyle = '#10b981';
    ctx.fillText('● Преломлённый луч', canvas.width - 140, 70);
}

// Автоматический запуск
if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', function() {
        if (document.getElementById('refraction-canvas')) {
            initRefraction();
        }
    });
} else if (document.attachEvent) {
    document.attachEvent('onreadystatechange', function() {
        if (document.readyState === 'complete') {
            if (document.getElementById('refraction-canvas')) {
                initRefraction();
            }
        }
    });
}

window.onload = function() {
    if (document.getElementById('refraction-canvas')) {
        initRefraction();
    }
};