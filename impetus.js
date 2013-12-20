var Impetus = function(cfg) {
	'use strict';
	
	var source, updateCallback;
	var multiplier = 1;
	var targetX = 0;
	var targetY = 0;
	var friction = 0.92;
	var preventDefault = true;
	var boundXmin, boundXmax, boundYmin, boundYmax;
	
	var ticking = false;
	var pointerActive = false;
	var paused = false;
	var trackingPoints = [];
	var pointerLastX;
	var pointerLastY;
	var pointerCurrentX;
	var pointerCurrentY;
	var pointerId;
	
	var decelerating = false;
	var decVelX;
	var decVelY;
	
	
	var requestAnimFrame = (function(){
		return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(callback) {
			window.setTimeout(callback, 1000 / 60);
		};
	})();
	
	
	var updateTarget = function() {
		updateCallback(targetX * multiplier, targetY * multiplier);
	};
	
	this.pause = function() {
		pointerActive = false;
		paused = true;
	};
	this.unpause = function() {
		paused = false;
	};
	
	var normalizeEvent = function(ev) {
		if (ev.type === 'touchmove' || ev.type === 'touchstart' || ev.type === 'touchend') {
			ev.preventDefault();
			var touch = ev.targetTouches[0] || ev.changedTouches[0];
			return {
				x: touch.clientX,
				y: touch.clientY,
				id: touch.identifier
			}
		} else { // if (ev.type === 'mousemove' || ev.type === 'mousedown' || ev.type === 'mouseup') {
			return {
				x: ev.clientX,
				y: ev.clientY,
				id: null
			};
		}
	};
	
	var onDown = function(ev) {
		var event = normalizeEvent(ev);
		if (!pointerActive && !paused) {
			pointerActive = true;
			decelerating = false;
			pointerId = event.id;
			
			pointerLastX = pointerCurrentX = event.x;
			pointerLastY = pointerCurrentY = event.y;
			trackingPoints = [];
			addTrackingPoint(pointerLastX, pointerLastY, Date.now());
		}
	};
	
	var onMove = function(ev) {
		var event = normalizeEvent(ev);
		
		if (pointerActive && event.id === pointerId) {
			pointerCurrentX = event.x;
			pointerCurrentY = event.y;
			addTrackingPoint(pointerLastX, pointerLastY, Date.now());
			requestTick();
		}
	};
	
	var onUp = function(ev) {
		var event = normalizeEvent(ev);
		
		if (pointerActive && event.id === pointerId) {
			pointerActive = false;
			addTrackingPoint(pointerLastX, pointerLastY, Date.now());
			startDecelAnim();
		}
	};
	
	
	var addTrackingPoint = function(x, y, time) {
		while (trackingPoints.length > 0) {
			if (time - trackingPoints[0].time <= 100) {
				break;
			}
			trackingPoints.shift();
		}
		
		trackingPoints.push({
			x: x,
			y: y,
			time: time
		});
	};
	
	var update = function() {
		targetX += pointerCurrentX - pointerLastX;
		targetY += pointerCurrentY - pointerLastY;
		
		checkBounds();
		updateTarget();
		
		pointerLastX = pointerCurrentX;
		pointerLastY = pointerCurrentY;
		ticking = false;
	};
	
	var requestTick = function() {
		if (!ticking) {
			requestAnimFrame(update);
		}
		ticking = true;
	};
	
	var checkBounds = function() {
		if (boundXmin && targetX < boundXmin) {
			targetX = boundXmin;
		}
		if (boundXmax && targetX > boundXmax) {
			targetX = boundXmax;
		}
		if (boundYmin && targetY < boundYmin) {
			targetY = boundYmin;
		}
		if (boundYmax && targetY > boundYmax) {
			targetY = boundYmax;
		}
	};
	
	
	var startDecelAnim = function() {
		var firstPoint = trackingPoints[0];
		var lastPoint = trackingPoints[trackingPoints.length - 1];
		
		var xOffset = lastPoint.x - firstPoint.x;
		var yOffset = lastPoint.y - firstPoint.y;
		var timeOffset = lastPoint.time - firstPoint.time;
		
		var D = timeOffset / 15;
		
		decVelX = xOffset / D;
		decVelY = yOffset / D;
		
		if (Math.abs(decVelX) > 1 || Math.abs(decVelY) > 1) {
			decelerating = true;
			requestAnimFrame(stepDecelAnim);
		}
	};
	
	var stepDecelAnim = function() {
		if (!decelerating) return;
		
		decVelX *= friction;
		decVelY *= friction;
		
		if (Math.abs(decVelX) > 0.5 || Math.abs(decVelY) > 0.5) {
			targetX += decVelX;
			targetY += decVelY;
			
			if (checkBounds()) {
				decelerating = false;
			}
			updateTarget();
			
			requestAnimFrame(stepDecelAnim);
		} else {
			decelerating = false;
		}
	};
	
	
	
	(function init() {
		if (cfg.source) {
			source = (typeof cfg.source === 'string') ? document.querySelector(cfg.source) : cfg.source;
			if (!source) {
				throw new Error('IMPETUS: source not found.');
			}
		} else {
			source = document;
		}
		
		if (cfg.update) {
			updateCallback = cfg.update || updateCallback;
		} else {
			throw new Error('IMPETUS: update function not defined.');
		}
		
		multiplier = cfg.multiplier || multiplier;
		friction = cfg.friction || friction;
		preventDefault = cfg.preventDefault || preventDefault;
		
		
		if (cfg.startPos) {
			if (cfg.startPos[0]) {
				targetX = cfg.startPos[0] / multiplier;
			}
			if (cfg.startPos[1]) {
				targetY = cfg.startPos[1] / multiplier;
			}
			updateTarget();
		}
		
		if (cfg.boundX) {
			boundXmin = cfg.boundX[0] / multiplier;
			boundXmax = cfg.boundX[1] / multiplier;
		}
		if (cfg.boundY) {
			boundYmin = cfg.boundY[0] / multiplier;
			boundYmax = cfg.boundY[1] / multiplier;
		}
		
		
		source.addEventListener('touchstart', onDown);
		document.body.addEventListener('touchmove', onMove);
		document.addEventListener('touchend', onUp);
		document.addEventListener('touchcancel', onUp);
		
		source.addEventListener('mousedown', onDown);
		document.body.addEventListener('mousemove', onMove);
		document.addEventListener('mouseup', onUp);
		
	})();
	
};