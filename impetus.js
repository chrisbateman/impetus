var Impetus = function(cfg) {
	var source, target, callback;
	var multiplier = 1;
	var targetX = 0;
	var targetY = 0;
	var friction = 0.9;
	var boundXmin, boundXmax, boundYmin, boundYmax;
	
	var ticking = false;
	var pointerActive = false;
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
		if (typeof callback === 'function') {
			callback(target, targetX * multiplier, targetY * multiplier);
		} else {
			target.x = targetX * multiplier;
			target.y = targetY * multiplier;
		}
	};
	
	
	var onDown = function(ev) {
		if (!pointerActive) {
			pointerActive = true;
			decelerating = false;
			pointerId = ev.pointerId;
			
			pointerLastX = pointerCurrentX = ev.clientX;
			pointerLastY = pointerCurrentY = ev.clientY;
			trackingPoints = []
			addTrackingPoint(pointerLastX, pointerLastY, Date.now());
		}
	};
	
	var onMove = function(ev) {
		ev.preventDefault();
		if (pointerActive && ev.pointerId === pointerId) {
			pointerCurrentX = ev.clientX;
			pointerCurrentY = ev.clientY;
			addTrackingPoint(pointerLastX, pointerLastY, Date.now());
			requestTick();
		}
	};
	
	var onUp = function(ev) {
		if (pointerActive && ev.pointerId === pointerId) {
			pointerActive = false;
			addTrackingPoint(pointerLastX, pointerLastY, Date.now());
			startAnim();
		}
	};
	
	
	var addTrackingPoint = function(x, y, time) {
		while (trackingPoints.length > 0) {
			if (time - trackingPoints[0].time <= 100) {
				break;
			}
			trackingPoints.shift()
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
	
	
	var startAnim = function() {
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
		target = (typeof cfg.target === 'string') ? document.querySelector(cfg.target) : cfg.target;
		
		if (cfg.source) {
			source = (typeof cfg.source === 'string') ? document.querySelector(cfg.source) : cfg.source;
		} else if (target.nodeType) {
			source = target;
		} else {
			throw new Error('IMPETUS: Source not defined (target is not a node)');
		}
		
		callback = cfg.update || callback;
		multiplier = cfg.multiplier || multiplier;
		friction = cfg.friction || friction;
		
		if (cfg.startX || cfg.startY) {
			if (cfg.startX) {
				targetX = cfg.startX / multiplier;
			}
			if (cfg.startY) {
				targetY = cfg.startY / multiplier;
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
		
		
		source.addEventListener('PointerDown', onDown);
		document.body.addEventListener('PointerMove', onMove);
		document.addEventListener('PointerUp', onUp);
		
	})();
	
};