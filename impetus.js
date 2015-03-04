/* Impetus.js
 * http://chrisbateman.github.com/impetus
 * Copyright (c) 2014 Chris Bateman
 * Licensed under the MIT license */

(function() {
	var Impetus = function(cfg) {
		'use strict';
		
		var sourceEl, updateCallback, boundXmin, boundXmax, boundYmin, boundYmax, pointerLastX, pointerLastY, pointerCurrentX, pointerCurrentY, pointerId, decVelX, decVelY;
		var targetX = 0;
		var targetY = 0;
		var multiplier = 1;
		var friction = 0.92;
		var stopThresholdDefault = 0.3;
		var stopThreshold = stopThresholdDefault;
		var ticking = false;
		var pointerActive = false;
		var paused = false;
		var decelerating = false;
		var trackingPoints = [];
		var bounces = true;
		var bounceDeceleration = 0.05;
		var bounceAcceleration = 0.09;
		
		
		/**
		 * @see http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
		 */
		var requestAnimFrame = (function(){
			return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(callback) {
				window.setTimeout(callback, 1000 / 60);
			};
		})();
		
		/**
		 * Disable movement processing
		 * @public
		 */
		this.pause = function() {
			pointerActive = false;
			paused = true;
		};
		
		/**
		 * Enable movement processing
		 * @public
		 */
		this.resume = function() {
			paused = false;
		};
		
		/**
		 * Update the current x and y values
		 * @public
		 * @param {Number} x
		 * @param {Number} y
		 */
		this.setValues = function(x, y) {
			if (typeof x === 'number') {
				targetX = x;
			}
			if (typeof y === 'number') {
				targetY = y;
			}
		};
		
		/**
		 * Update the multiplier value
		 * @public
		 * @param {Number} val
		 */
		this.setMultiplier = function(val) {
			multiplier = val;
			stopThreshold = stopThresholdDefault * multiplier;
		};
		
		/**
		 * Executes the update function
		 */
		var callUpdateCallback = function() {
			updateCallback.call(sourceEl, targetX, targetY);
		};
		
		/**
		 * Creates a custom normalized event object from touch and mouse events
		 * @param  {Event} ev
		 * @returns {Object} with x, y, and id properties
		 */
		var normalizeEvent = function(ev) {
			if (ev.type === 'touchmove' || ev.type === 'touchstart' || ev.type === 'touchend') {
				var touch = ev.targetTouches[0] || ev.changedTouches[0];
				return {
					x: touch.clientX,
					y: touch.clientY,
					id: touch.identifier
				};
			} else { // mouse events
				return {
					x: ev.clientX,
					y: ev.clientY,
					id: null
				};
			}
		};
		
		/**
		 * Initializes movement tracking
		 * @param  {Object} ev Normalized event
		 */
		var onDown = function(ev) {
			var event = normalizeEvent(ev);
			if (!pointerActive && !paused) {
				pointerActive = true;
				decelerating = false;
				pointerId = event.id;
				
				pointerLastX = pointerCurrentX = event.x;
				pointerLastY = pointerCurrentY = event.y;
				trackingPoints = [];
				addTrackingPoint(pointerLastX, pointerLastY);
				
				document.addEventListener('touchmove', onMove);
				document.addEventListener('touchend', onUp);
				document.addEventListener('touchcancel', stopTracking);
				document.addEventListener('mousemove', onMove);
				document.addEventListener('mouseup', onUp);
			}
		};
		
		/**
		 * Handles move events
		 * @param  {Object} ev Normalized event
		 */
		var onMove = function(ev) {
			ev.preventDefault();
			var event = normalizeEvent(ev);
			
			if (pointerActive && event.id === pointerId) {
				pointerCurrentX = event.x;
				pointerCurrentY = event.y;
				addTrackingPoint(pointerLastX, pointerLastY);
				requestTick();
			}
		};
		
		/**
		 * Handles up/end events
		 * @param  {Object} ev Normalized event
		 */
		var onUp = function(ev) {
			var event = normalizeEvent(ev);
			
			if (pointerActive && event.id === pointerId) {
				stopTracking();
			}
		};
		
		/**
		 * Stops movement tracking, starts animation
		 */
		var stopTracking = function() {
			pointerActive = false;
			addTrackingPoint(pointerLastX, pointerLastY);
			startDecelAnim();
			
			document.removeEventListener('touchmove', onMove);
			document.removeEventListener('touchend', onUp);
			document.removeEventListener('touchcancel', stopTracking);
			document.removeEventListener('mouseup', onUp);
			document.removeEventListener('mousemove', onMove);
		};
		
		/**
		 * Records movement for the last 100ms
		 * @param {number} x
		 * @param {number} y [description]
		 */
		var addTrackingPoint = function(x, y) {
			var time = Date.now();
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
		
		/**
		 * Calculate new values, call update function
		 */
		var update = function() {
			targetX += (pointerCurrentX - pointerLastX) * multiplier;
			targetY += (pointerCurrentY - pointerLastY) * multiplier;
			
			if (bounces) {
				var diff = checkBounds();
				if (diff.x !== 0) {
					var pointerChangeX = pointerCurrentX - pointerLastX;
					targetX -= pointerChangeX * 0.5;
				}
				if (diff.y !== 0) {
					var pointerChangeY = pointerCurrentY - pointerLastY;
					targetY -= pointerChangeY * 0.5;
				}
			} else {
				checkBounds(true);
			}
			
			callUpdateCallback();
			
			pointerLastX = pointerCurrentX;
			pointerLastY = pointerCurrentY;
			ticking = false;
		};
		
		/**
		 * prevents animating faster than current framerate
		 */
		var requestTick = function() {
			if (!ticking) {
				requestAnimFrame(update);
			}
			ticking = true;
		};
		
		/**
		 * Initializes the bound values
		 */
		var initBounds = function() {
			if (cfg.boundX) {
				boundXmin = cfg.boundX[0];
				boundXmax = cfg.boundX[1];
			}
			if (cfg.boundY) {
				boundYmin = cfg.boundY[0];
				boundYmax = cfg.boundY[1];
			}
		};
		
		
		/**
		 * Determine position relative to bounds
		 * @param {Boolean} restrict Whether to restrict target to bounds
		 */
		var checkBounds = function(restrict) {
			var xDiff = 0;
			var yDiff = 0;
			
			if (boundXmin !== undefined && targetX < boundXmin) {
				xDiff = boundXmin - targetX;
			} else if (boundXmax !== undefined && targetX > boundXmax) {
				xDiff = boundXmax - targetX;
			}
			
			if (boundYmin !== undefined && targetY < boundYmin) {
				yDiff = boundYmin - targetY;
			} else if (boundYmax !== undefined && targetY > boundYmax) {
				yDiff = boundYmax - targetY;
			}
			
			if (restrict) {
				if (xDiff !== 0) {
					targetX = (xDiff > 0) ? boundXmin : boundXmax;
				}
				if (yDiff !== 0) {
					targetY = (yDiff > 0) ? boundYmin : boundYmax;
				}
			}
			
			return {
				x: xDiff,
				y: yDiff,
				inBounds: xDiff === 0 && yDiff === 0
			};
		};
		
		
		/**
		 * Initialize animation of values coming to a stop
		 */
		var startDecelAnim = function() {
			var firstPoint = trackingPoints[0];
			var lastPoint = trackingPoints[trackingPoints.length - 1];
			
			var xOffset = lastPoint.x - firstPoint.x;
			var yOffset = lastPoint.y - firstPoint.y;
			var timeOffset = lastPoint.time - firstPoint.time;
			
			var D = (timeOffset / 15) / multiplier;
			
			decVelX = (xOffset / D) || 0; // prevent NaN
			decVelY = (yOffset / D) || 0;
			
			var diff = checkBounds();
			
			if ((Math.abs(decVelX) > 1 || Math.abs(decVelY) > 1) || !diff.inBounds){
				decelerating = true;
				requestAnimFrame(stepDecelAnim);
			}
		};
		
		
		/**
		 * Animates values slowing down
		 */
		var stepDecelAnim = function() {
			if (!decelerating) {
				return;
			}
			
			decVelX *= friction;
			decVelY *= friction;
			
			targetX += decVelX;
			targetY += decVelY;
			
			var diff = checkBounds();
			
			if ((Math.abs(decVelX) > stopThreshold || Math.abs(decVelY) > stopThreshold) || !diff.inBounds) {
				
				if (bounces) {
					var reboundAdjust = 2.5;
					
					if (diff.x !== 0) {
						if (diff.x * decVelX <= 0) {
							decVelX += diff.x * bounceDeceleration;
						} else {
							var adjust = (diff.x > 0) ? reboundAdjust : -reboundAdjust;
							decVelX = (diff.x + adjust) * bounceAcceleration;
						}
					}
					if (diff.y !== 0) {
						if (diff.y * decVelY <= 0) {
							decVelY += diff.y * bounceDeceleration;
						} else {
							var adjust = (diff.y > 0) ? reboundAdjust : -reboundAdjust;
							decVelY = (diff.y + adjust) * bounceAcceleration;
						}
					}
				} else {
					if (diff.x !== 0) {
						if (diff.x > 0) {
							targetX = boundXmin;
						} else {
							targetX = boundXmax;
						}
						decVelX = 0;
					}
					if (diff.y !== 0) {
						if (diff.y > 0) {
							targetY = boundYmin;
						} else {
							targetY = boundYmax;
						}
						decVelY = 0;
					}
				}
				
				callUpdateCallback();
				
				requestAnimFrame(stepDecelAnim);
			} else {
				decelerating = false;
			}
		};
		
		
		
		
		/**
		 * Initialize instance
		 */
		(function init() {
			if (cfg.source) {
				sourceEl = (typeof cfg.source === 'string') ? document.querySelector(cfg.source) : cfg.source;
				if (!sourceEl) {
					throw new Error('IMPETUS: source not found.');
				}
			} else {
				sourceEl = document;
			}
			
			if (cfg.update) {
				updateCallback = cfg.update;
			} else {
				throw new Error('IMPETUS: update function not defined.');
			}
			
			if (typeof cfg.multiplier !== 'undefined') {
				multiplier = cfg.multiplier || multiplier;
				stopThreshold = stopThresholdDefault * multiplier;
			}
			if (typeof cfg.friction !== 'undefined') {
				friction = cfg.friction || friction;
			}
			if (cfg.bounces === false) {
				bounces = false;
			}
			
			if (cfg.initialValues) {
				if (cfg.initialValues[0]) {
					targetX = cfg.initialValues[0];
				}
				if (cfg.initialValues[1]) {
					targetY = cfg.initialValues[1];
				}
				callUpdateCallback();
			}
			
			initBounds();
			
			sourceEl.addEventListener('touchstart', onDown);
			sourceEl.addEventListener('mousedown', onDown);
			
		})();
	};
	
	// AMD
	if (typeof define === 'function' && define.amd) {
		define(function() {
			return Impetus;
		});
	} else {
		this.Impetus = Impetus;
	}
	
})();