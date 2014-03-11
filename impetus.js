/* Impetus.js
 * http://chrisbateman.github.com/impetus
 *
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
		var ticking = false;
		var pointerActive = false;
		var paused = false;
		var decelerating = false;
		var trackingPoints = [];
		
		
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
		 * Update the multiplier value
		 * @public
		 * @param {Number} val
		 */
		this.setMultiplier = function(val) {
			multiplier = val;
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
			
			checkBounds();
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
		 * Keep values in bounds, if available
		 */
		var checkBounds = function() {
			if (boundXmin !== undefined && targetX < boundXmin) {
				targetX = boundXmin;
			}
			if (boundXmax !== undefined && targetX > boundXmax) {
				targetX = boundXmax;
			}
			if (boundYmin !== undefined && targetY < boundYmin) {
				targetY = boundYmin;
			}
			if (boundYmax !== undefined && targetY > boundYmax) {
				targetY = boundYmax;
			}
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
			
			decVelX = xOffset / D;
			decVelY = yOffset / D;
			
			if (Math.abs(decVelX) > 1 || Math.abs(decVelY) > 1) {
				decelerating = true;
				requestAnimFrame(stepDecelAnim);
			}
		};
		
		/**
		 * Animates values slowing down
		 */
		var stepDecelAnim = function() {
			if (!decelerating) return;
			
			decVelX *= friction;
			decVelY *= friction;
			
			if (Math.abs(decVelX) > 0.4 || Math.abs(decVelY) > 0.4) {
				targetX += decVelX;
				targetY += decVelY;
				
				if (checkBounds()) {
					decelerating = false;
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
			}
			if (typeof cfg.friction !== 'undefined') {
				friction = cfg.friction || friction;
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
	if (typeof define === "function" && define.amd) {
		define(function() {
			return Impetus;
		});
	} else {
		this.Impetus = Impetus;
	}
	
})();