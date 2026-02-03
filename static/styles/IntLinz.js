class LensSimulation {
    constructor() {
        this.canvas = document.getElementById('lensCanvas');
        this.ctx = this.canvas.getContext('2d');


        this.params = {
            lensType: 'converging',
            focalLength: 20,
            objectDistance: 30,
            objectHeight: 10,
            scale: 40,
            opticalCenter: { x: this.canvas.width / 2, y: this.canvas.height / 2 }
        };


        this.rays = [];


        this.activeTool = 'parallel';


        this.initElements();
        this.initEventListeners();
        this.initCanvas();
        this.update();
    }

    initElements() {
        this.focalLength = document.getElementById('focalLength');
        this.objectDistance = document.getElementById('objectDistance');
        this.objectHeight = document.getElementById('objectHeight');

        this.focalValue = document.getElementById('focalValue');
        this.distanceValue = document.getElementById('distanceValue');
        this.heightValue = document.getElementById('heightValue');

        this.convergingBtn = document.getElementById('convergingBtn');
        this.divergingBtn = document.getElementById('divergingBtn');

        this.parallelRayBtn = document.getElementById('parallelRayBtn');
        this.focalRayBtn = document.getElementById('focalRayBtn');
        this.centerRayBtn = document.getElementById('centerRayBtn');
        this.clearRaysBtn = document.getElementById('clearRaysBtn');

        this.imageType = document.getElementById('imageType');
        this.imageOrientation = document.getElementById('imageOrientation');
        this.imageSize = document.getElementById('imageSize');
        this.imageDistance = document.getElementById('imageDistance');
        this.magnification = document.getElementById('magnification');
        this.imageVisibility = document.getElementById('imageVisibility');
        this.currentFormula = document.getElementById('currentFormula');

        this.resetBtn = document.getElementById('resetBtn');
        this.helpBtn = document.getElementById('helpBtn');

        this.modal = document.getElementById('helpModal');
        this.closeModalBtns = document.querySelectorAll('.close-modal');

        this.exampleBtns = document.querySelectorAll('.example-btn');
    }

    initEventListeners() {
        this.focalLength.addEventListener('input', () => this.updateParams());
        this.objectDistance.addEventListener('input', () => this.updateParams());
        this.objectHeight.addEventListener('input', () => this.updateParams());

        this.convergingBtn.addEventListener('click', () => this.setLensType('converging'));
        this.divergingBtn.addEventListener('click', () => this.setLensType('diverging'));

        this.parallelRayBtn.addEventListener('click', () => this.setActiveTool('parallel'));
        this.focalRayBtn.addEventListener('click', () => this.setActiveTool('focal'));
        this.centerRayBtn.addEventListener('click', () => this.setActiveTool('center'));
        this.clearRaysBtn.addEventListener('click', () => this.clearRays());

        this.resetBtn.addEventListener('click', () => this.reset());
        this.helpBtn.addEventListener('click', () => this.showHelp());

        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

        this.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => this.hideHelp());
        });

        window.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hideHelp();
        });

        this.exampleBtns.forEach(btn => {
            btn.addEventListener('click', () => this.loadExample(btn));
        });
    }

    initCanvas() {
        const container = this.canvas.parentElement;
        const updateCanvasSize = () => {
            const width = container.clientWidth;
            const height = Math.min(500, window.innerHeight * 0.6);

            this.canvas.width = width;
            this.canvas.height = height;
            this.params.opticalCenter = {
                x: width / 2,
                y: height / 2
            };

            this.draw();
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
    }

    updateParams() {
        this.params.focalLength = parseInt(this.focalLength.value);
        this.params.objectDistance = parseInt(this.objectDistance.value);
        this.params.objectHeight = parseInt(this.objectHeight.value);

        this.focalValue.textContent = `${this.params.focalLength} см`;
        this.distanceValue.textContent = `${this.params.objectDistance} см`;
        this.heightValue.textContent = `${this.params.objectHeight} см`;

        this.update();
    }

    setLensType(type) {
        this.params.lensType = type;

        if (type === 'converging') {
            this.convergingBtn.classList.add('active');
            this.divergingBtn.classList.remove('active');
        } else {
            this.convergingBtn.classList.remove('active');
            this.divergingBtn.classList.add('active');

            this.params.focalLength = -Math.abs(this.params.focalLength);
            this.focalLength.value = Math.abs(this.params.focalLength);
            this.focalValue.textContent = `${Math.abs(this.params.focalLength)} см`;
        }

        this.update();
    }

    setActiveTool(tool) {
        this.activeTool = tool;

        [this.parallelRayBtn, this.focalRayBtn, this.centerRayBtn].forEach(btn => {
            btn.classList.remove('active');
        });

        if (tool === 'parallel') this.parallelRayBtn.classList.add('active');
        else if (tool === 'focal') this.focalRayBtn.classList.add('active');
        else if (tool === 'center') this.centerRayBtn.classList.add('active');
    }

    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.addRay(x, y);
    }

    addRay(mouseX, mouseY) {
        const { opticalCenter, objectDistance, objectHeight, scale } = this.params;

        const objectX = opticalCenter.x - objectDistance * scale;
        const objectTopY = opticalCenter.y - objectHeight * scale;
        const objectBottomY = opticalCenter.y + objectHeight * scale;

        let rayStartY;
        if (mouseY < opticalCenter.y) {
            rayStartY = objectTopY;
        } else {
            rayStartY = objectBottomY;
        }

        this.rays.push({
            tool: this.activeTool,
            startX: objectX,
            startY: rayStartY,
            mouseX: mouseX,
            mouseY: mouseY,
            timestamp: Date.now()
        });

        if (this.rays.length > 10) {
            this.rays.shift();
        }

        this.draw();
    }

    clearRays() {
        this.rays = [];
        this.draw();
    }

    reset() {
        this.params.focalLength = 20;
        this.params.objectDistance = 30;
        this.params.objectHeight = 10;
        this.params.lensType = 'converging';

        this.focalLength.value = this.params.focalLength;
        this.objectDistance.value = this.params.objectDistance;
        this.objectHeight.value = this.params.objectHeight;

        this.setLensType('converging');

        this.setActiveTool('parallel');

        this.clearRays();

        this.update();
    }

    update() {
        this.calculateImage();
        this.draw();
        this.updateFormula();
    }

    calculateImage() {
        const { lensType, focalLength, objectDistance, objectHeight } = this.params;

        if (lensType === 'converging') {
            if (objectDistance === Math.abs(focalLength)) {
                this.imageType.textContent = 'Нет изображения';
                this.imageOrientation.textContent = '—';
                this.imageSize.textContent = '—';
                this.imageDistance.textContent = '∞';
                this.magnification.textContent = '—';
                this.imageVisibility.textContent = 'Отсутствует';
            } else {
                const f = 1 / (1 / focalLength - 1 / objectDistance);
                const magnification = Math.abs(f / objectDistance);

                let type, orientation, size, visibility;

                if (objectDistance > Math.abs(focalLength)) {
                    type = 'Действительное';
                    orientation = 'Перевёрнутое';
                    visibility = 'На экране';
                } else {
                    type = 'Мнимое';
                    orientation = 'Прямое';
                    visibility = 'Визуально';
                }

                if (magnification > 1.1) size = 'Увеличенное';
                else if (magnification < 0.9) size = 'Уменьшенное';
                else size = 'Равное';

                this.imageType.textContent = type;
                this.imageOrientation.textContent = orientation;
                this.imageSize.textContent = size;
                this.imageDistance.textContent = `${Math.abs(f).toFixed(1)} см`;
                this.magnification.textContent = `${magnification.toFixed(2)}×`;
                this.imageVisibility.textContent = visibility;
            }
        } else {
            const absF = Math.abs(focalLength);
            const f = -absF;
            const imageDistance = 1 / (1 / f - 1 / objectDistance);
            const magnification = Math.abs(imageDistance / objectDistance);

            this.imageType.textContent = 'Мнимое';
            this.imageOrientation.textContent = 'Прямое';
            this.imageSize.textContent = 'Уменьшенное';
            this.imageDistance.textContent = `${Math.abs(imageDistance).toFixed(1)} см`;
            this.magnification.textContent = `${magnification.toFixed(2)}×`;
            this.imageVisibility.textContent = 'Визуально';
        }
    }

    updateFormula() {
        const { focalLength, objectDistance } = this.params;
        const f = 1 / (1 / focalLength - 1 / objectDistance);

        this.currentFormula.textContent =
            `1/${Math.abs(focalLength)} = 1/${objectDistance} + 1/${Math.abs(f).toFixed(1)}`;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawOpticalAxis();

        this.drawLens();

        this.drawFocalPoints();

        this.drawObject();

        this.drawImage();

        this.drawRays();

        this.drawLabels();
    }

    drawOpticalAxis() {
        const { opticalCenter } = this.params;

        this.ctx.beginPath();
        this.ctx.moveTo(50, opticalCenter.y);
        this.ctx.lineTo(this.canvas.width - 50, opticalCenter.y);
        this.ctx.strokeStyle = '#a0aec0';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 3]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawLens() {
        const { opticalCenter, lensType } = this.params;
        const lensWidth = 100;
        const lensHeight = 200;

        this.ctx.beginPath();

        if (lensType === 'converging') {
            this.ctx.moveTo(opticalCenter.x, opticalCenter.y - lensHeight / 2);
            this.ctx.bezierCurveTo(
                opticalCenter.x + lensWidth / 2, opticalCenter.y - lensHeight / 2,
                opticalCenter.x + lensWidth / 2, opticalCenter.y + lensHeight / 2,
                opticalCenter.x, opticalCenter.y + lensHeight / 2
            );
            this.ctx.moveTo(opticalCenter.x, opticalCenter.y - lensHeight / 2);
            this.ctx.bezierCurveTo(
                opticalCenter.x - lensWidth / 2, opticalCenter.y - lensHeight / 2,
                opticalCenter.x - lensWidth / 2, opticalCenter.y + lensHeight / 2,
                opticalCenter.x, opticalCenter.y + lensHeight / 2
            );
        } else {
            this.ctx.moveTo(opticalCenter.x - lensWidth / 2, opticalCenter.y - lensHeight / 2);
            this.ctx.bezierCurveTo(
                opticalCenter.x, opticalCenter.y - lensHeight / 2,
                opticalCenter.x, opticalCenter.y + lensHeight / 2,
                opticalCenter.x - lensWidth / 2, opticalCenter.y + lensHeight / 2
            );
            this.ctx.moveTo(opticalCenter.x + lensWidth / 2, opticalCenter.y - lensHeight / 2);
            this.ctx.bezierCurveTo(
                opticalCenter.x, opticalCenter.y - lensHeight / 2,
                opticalCenter.x, opticalCenter.y + lensHeight / 2,
                opticalCenter.x + lensWidth / 2, opticalCenter.y + lensHeight / 2
            );
        }

        this.ctx.strokeStyle = '#4a5568';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(opticalCenter.x, opticalCenter.y, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = '#667eea';
        this.ctx.fill();
    }

    drawFocalPoints() {
        const { opticalCenter, focalLength, scale } = this.params;
        const absF = Math.abs(focalLength);

        const rightFocusX = opticalCenter.x + absF * scale;
        const leftFocusX = opticalCenter.x - absF * scale;

        this.ctx.beginPath();
        this.ctx.arc(rightFocusX, opticalCenter.y, 6, 0, Math.PI * 2);
        this.ctx.arc(leftFocusX, opticalCenter.y, 6, 0, Math.PI * 2);
        this.ctx.fillStyle = '#e53e3e';
        this.ctx.fill();

        this.ctx.fillStyle = '#e53e3e';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('F', rightFocusX, opticalCenter.y - 15);
        this.ctx.fillText('F', leftFocusX, opticalCenter.y - 15);

        const right2FX = opticalCenter.x + 2 * absF * scale;
        const left2FX = opticalCenter.x - 2 * absF * scale;

        this.ctx.beginPath();
        this.ctx.arc(right2FX, opticalCenter.y, 5, 0, Math.PI * 2);
        this.ctx.arc(left2FX, opticalCenter.y, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = '#38a169';
        this.ctx.fill();

        this.ctx.fillStyle = '#38a169';
        this.ctx.fillText('2F', right2FX, opticalCenter.y - 15);
        this.ctx.fillText('2F', left2FX, opticalCenter.y - 15);

        this.ctx.textAlign = 'left';
    }

    drawObject() {
        const { opticalCenter, objectDistance, objectHeight, scale } = this.params;
        const objectX = opticalCenter.x - objectDistance * scale;

        this.ctx.beginPath();
        this.ctx.moveTo(objectX, opticalCenter.y);
        this.ctx.lineTo(objectX, opticalCenter.y - objectHeight * scale);
        this.ctx.lineTo(objectX - 10, opticalCenter.y - objectHeight * scale + 15);
        this.ctx.moveTo(objectX, opticalCenter.y - objectHeight * scale);
        this.ctx.lineTo(objectX + 10, opticalCenter.y - objectHeight * scale + 15);

        this.ctx.strokeStyle = '#2d3748';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        this.ctx.fillStyle = '#2d3748';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText('Предмет', objectX - 40, opticalCenter.y - objectHeight * scale - 10);
    }

    drawImage() {
        const { lensType, focalLength, objectDistance, objectHeight, opticalCenter, scale } = this.params;

        if (lensType === 'converging' && objectDistance === Math.abs(focalLength)) {
            return;
        }

        const f = 1 / (1 / focalLength - 1 / objectDistance);
        const imageX = opticalCenter.x + f * scale;
        const magnification = Math.abs(f / objectDistance);
        const imageHeight = objectHeight * magnification * scale;

        const isReal = lensType === 'converging' && objectDistance > Math.abs(focalLength);
        const isVirtual = !isReal;

        this.ctx.save();

        if (isVirtual) {
            this.ctx.setLineDash([5, 5]);
        }

        this.ctx.beginPath();
        if (isReal) {
            this.ctx.moveTo(imageX, opticalCenter.y);
            this.ctx.lineTo(imageX, opticalCenter.y + imageHeight);
            this.ctx.lineTo(imageX - 10, opticalCenter.y + imageHeight - 15);
            this.ctx.moveTo(imageX, opticalCenter.y + imageHeight);
            this.ctx.lineTo(imageX + 10, opticalCenter.y + imageHeight - 15);
        } else {
            this.ctx.moveTo(imageX, opticalCenter.y);
            this.ctx.lineTo(imageX, opticalCenter.y - imageHeight);
            this.ctx.lineTo(imageX - 10, opticalCenter.y - imageHeight + 15);
            this.ctx.moveTo(imageX, opticalCenter.y - imageHeight);
            this.ctx.lineTo(imageX + 10, opticalCenter.y - imageHeight + 15);
        }

        this.ctx.strokeStyle = isReal ? '#3182ce' : '#805ad5';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        this.ctx.restore();

        const imageType = isReal ? 'Изображение' : 'Мнимое изображение';
        this.ctx.fillStyle = isReal ? '#3182ce' : '#805ad5';
        this.ctx.font = 'bold 14px Arial';

        if (isReal) {
            this.ctx.fillText(imageType, imageX - 50, opticalCenter.y + imageHeight + 20);
        } else {
            this.ctx.fillText(imageType, imageX - 70, opticalCenter.y - imageHeight - 10);
        }
    }

    drawRays() {
        const { opticalCenter, focalLength, objectDistance, objectHeight, scale, lensType } = this.params;
        const objectX = opticalCenter.x - objectDistance * scale;
        const objectTopY = opticalCenter.y - objectHeight * scale;
        const objectBottomY = opticalCenter.y + objectHeight * scale;

        this.rays.forEach((ray, index) => {
            const age = Date.now() - ray.timestamp;
            const opacity = Math.max(0.3, 1 - age / 15000);

            this.ctx.save();
            this.ctx.globalAlpha = opacity;

            let color;
            switch (ray.tool) {
                case 'parallel': color = '#d69e2e'; break;
                case 'focal': color = '#2b6cb0'; break;
                case 'center': color = '#2f855a'; break;
            }

            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(ray.startX, ray.startY);

            if (ray.tool === 'parallel') {
                this.ctx.lineTo(opticalCenter.x, ray.startY);

                if (lensType === 'converging') {
                    const focusX = opticalCenter.x + Math.abs(focalLength) * scale;
                    const slope = (opticalCenter.y - ray.startY) / (focusX - opticalCenter.x);
                    this.ctx.lineTo(this.canvas.width - 50, ray.startY + slope * (this.canvas.width - 50 - opticalCenter.x));
                } else {
                    const virtualFocusX = opticalCenter.x - Math.abs(focalLength) * scale;
                    const slope = (ray.startY - opticalCenter.y) / (opticalCenter.x - virtualFocusX);
                    this.ctx.lineTo(this.canvas.width - 50, opticalCenter.y + slope * (this.canvas.width - 50 - opticalCenter.x));
                }
            }
            else if (ray.tool === 'focal') {
                if (lensType === 'converging') {
                    const focusX = opticalCenter.x - Math.abs(focalLength) * scale;
                    const intersectY = opticalCenter.y + (ray.startY - opticalCenter.y) *
                        (opticalCenter.x - objectX) / (focusX - objectX);

                    if (intersectY > 0 && intersectY < this.canvas.height) {
                        this.ctx.lineTo(opticalCenter.x, intersectY);
                        this.ctx.lineTo(this.canvas.width - 50, intersectY);
                    }
                } else {
                    this.ctx.lineTo(opticalCenter.x, ray.startY);
                    const slope = (ray.startY - opticalCenter.y) / (objectX - opticalCenter.x);
                    this.ctx.lineTo(this.canvas.width - 50, opticalCenter.y + slope * (this.canvas.width - 50 - opticalCenter.x));
                }
            }
            else if (ray.tool === 'center') {
                this.ctx.lineTo(opticalCenter.x, opticalCenter.y);
                const slope = (opticalCenter.y - ray.startY) / (opticalCenter.x - objectX);
                this.ctx.lineTo(this.canvas.width - 50, opticalCenter.y + slope * (this.canvas.width - 50 - opticalCenter.x));
            }

            this.ctx.stroke();
            this.ctx.restore();
        });
    }

    drawLabels() {
        const { opticalCenter, focalLength, objectDistance, scale } = this.params;

        this.ctx.fillStyle = '#4a5568';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';

        const objectX = opticalCenter.x - objectDistance * scale;
        const focusX = opticalCenter.x + Math.abs(focalLength) * scale;

        this.ctx.beginPath();
        this.ctx.moveTo(objectX, opticalCenter.y + 30);
        this.ctx.lineTo(opticalCenter.x, opticalCenter.y + 30);
        this.ctx.strokeStyle = '#718096';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        this.ctx.fillText(`d = ${objectDistance} см`,
            (objectX + opticalCenter.x) / 2,
            opticalCenter.y + 45);

        this.ctx.beginPath();
        this.ctx.moveTo(opticalCenter.x, opticalCenter.y + 60);
        this.ctx.lineTo(focusX, opticalCenter.y + 60);
        this.ctx.stroke();

        this.ctx.fillText(`F = ${Math.abs(focalLength)} см`,
            (opticalCenter.x + focusX) / 2,
            opticalCenter.y + 75);

        this.ctx.textAlign = 'left';
    }

    loadExample(button) {
        const focalLength = parseFloat(button.dataset.f);
        const objectDistance = parseFloat(button.dataset.d);
        const objectHeight = parseFloat(button.dataset.h);

        this.params.focalLength = focalLength;
        this.params.objectDistance = objectDistance;
        this.params.objectHeight = objectHeight;

        if (focalLength < 0) {
            this.setLensType('diverging');
            this.params.focalLength = Math.abs(focalLength);
        } else {
            this.setLensType('converging');
        }

        this.focalLength.value = Math.abs(focalLength);
        this.objectDistance.value = objectDistance;
        this.objectHeight.value = objectHeight;

        this.clearRays();

        this.updateParams();
    }

    showHelp() {
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    hideHelp() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const simulation = new LensSimulation();

    window.simulation = simulation;
});
