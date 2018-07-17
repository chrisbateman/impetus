
const stopThresholdDefault = 0.3;
const bounceDeceleration = 0.04;
const bounceAcceleration = 0.11;


// fixes weird safari 10 bug where preventDefault is prevented
// @see https://github.com/metafizzy/flickity/issues/457#issuecomment-254501356
window.addEventListener('touchmove', function() {});


export default class Impetus {
    constructor({
        source: sourceEl = document,
        onStart: startCallback,
        onUpdate: updateCallback,
        onStartDecelerating: startDeceleratingCallback,
        onEndDecelerating: endDeceleratingCallback,
        multiplier = 1,
        friction = 0.92,
        initialValues,
        boundX,
        boundY,
        bounce = true
    }) {
        var boundXmin, boundXmax, boundYmin, boundYmax, pointerLastX, pointerLastY, pointerCurrentX, pointerCurrentY, pointerId, decVelX, decVelY;
        var targetX = 0;
        var targetY = 0;
        var stopThreshold = stopThresholdDefault * multiplier;
        var ticking = false;
        var pointerActive = false;
        var paused = false;
        var decelerating = false;
        var trackingPoints = [];


        /**
         * Initialize instance
         */
        (function init() {
            sourceEl = (typeof sourceEl === 'string') ? document.querySelector(sourceEl) : sourceEl;
            if (!sourceEl) {
                throw new Error('IMPETUS: source not found.');
            }

            if (!updateCallback) {
                throw new Error('IMPETUS: update function not defined.');
            }

            if (initialValues) {
                if (initialValues[0]) {
                    targetX = initialValues[0];
                }
                if (initialValues[1]) {
                    targetY = initialValues[1];
                }
                callUpdateCallback();
            }

            // Initialize bound values
            if (boundX) {
                boundXmin = boundX[0];
                boundXmax = boundX[1];
            }
            if (boundY) {
                boundYmin = boundY[0];
                boundYmax = boundY[1];
            }

            sourceEl.addEventListener('touchstart', onDown);
            sourceEl.addEventListener('mousedown', onDown);
        })();

        /**
         * In edge cases where you may need to
         * reinstanciate Impetus on the same sourceEl
         * this will remove the previous event listeners
         */
        this.destroy = function() {
            sourceEl.removeEventListener('touchstart', onDown);
            sourceEl.removeEventListener('mousedown', onDown);
            // however it won't "destroy" a reference
            // to instance if you'd like to do that
            // it returns null as a convinience.
            // ex: `instance = instance.destroy();`
            return null;
        };

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
         * Update boundX value
         * @public
         * @param {Number[]} boundX
         */
        this.setBoundX = function(boundX) {
            boundXmin = boundX[0];
            boundXmax = boundX[1];
        };

        /**
         * Update boundY value
         * @public
         * @param {Number[]} boundY
         */
        this.setBoundY = function(boundY) {
            boundYmin = boundY[0];
            boundYmax = boundY[1];
        };

        /**
         * Executes the update function
         */
        function callUpdateCallback() {
            updateCallback.call(sourceEl, targetX, targetY);
        }

        /**
         * Executes the start function
         */
        function callStartCallback() {
            if (!startCallback) {
                return;
            }
            startCallback.call(sourceEl, targetX, targetY);
        }

        /**
         * Executes the start decelerating function
         */
        function callStartDeceleratingCallback() {
            if (!startDeceleratingCallback) {
                return;
            }
            startDeceleratingCallback.call(sourceEl, targetX, targetY);
        }

        /**
         * Executes the end decelerating function
         */
        function callEndDeceleratingCallback() {
            if (!endDeceleratingCallback) {
                return;
            }
            endDeceleratingCallback.call(sourceEl, targetX, targetY);
        }

        /**
         * Creates a custom normalized event object from touch and mouse events
         * @param  {Event} ev
         * @returns {Object} with x, y, and id properties
         */
        function normalizeEvent(ev) {
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
        }

        /**
         * Initializes movement tracking
         * @param  {Object} ev Normalized event
         */
        function onDown(ev) {
            var event = normalizeEvent(ev);
            if (!pointerActive && !paused) {
                callStartCallback();
                pointerActive = true;
                decelerating = false;
                pointerId = event.id;

                pointerLastX = pointerCurrentX = event.x;
                pointerLastY = pointerCurrentY = event.y;
                trackingPoints = [];
                addTrackingPoint(pointerLastX, pointerLastY);

                // @see https://developers.google.com/web/updates/2017/01/scrolling-intervention
                document.addEventListener('touchmove', onMove, getPassiveSupported() ? {passive: false} : false);
                document.addEventListener('touchend', onUp);
                document.addEventListener('touchcancel', stopTracking);
                document.addEventListener('mousemove', onMove, getPassiveSupported() ? {passive: false} : false);
                document.addEventListener('mouseup', onUp);
            }
        }

        /**
         * Handles move events
         * @param  {Object} ev Normalized event
         */
        function onMove(ev) {
            ev.preventDefault();
            var event = normalizeEvent(ev);

            if (pointerActive && event.id === pointerId) {
                pointerCurrentX = event.x;
                pointerCurrentY = event.y;
                addTrackingPoint(pointerLastX, pointerLastY);
                requestTick();
            }
        }

        /**
         * Handles up/end events
         * @param {Object} ev Normalized event
         */
        function onUp(ev) {
            var event = normalizeEvent(ev);

            if (pointerActive && event.id === pointerId) {
                stopTracking();
            }
        }

        /**
         * Stops movement tracking, starts animation
         */
        function stopTracking() {
            pointerActive = false;
            addTrackingPoint(pointerLastX, pointerLastY);
            startDecelAnim();

            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onUp);
            document.removeEventListener('touchcancel', stopTracking);
            document.removeEventListener('mouseup', onUp);
            document.removeEventListener('mousemove', onMove);
        }

        /**
         * Records movement for the last 100ms
         * @param {number} x
         * @param {number} y [description]
         */
        function addTrackingPoint(x, y) {
            var time = Date.now();
            while (trackingPoints.length > 0) {
                if (time - trackingPoints[0].time <= 100) {
                    break;
                }
                trackingPoints.shift();
            }

            trackingPoints.push({x, y, time});
        }

        /**
         * Calculate new values, call update function
         */
        function updateAndRender() {
            var pointerChangeX = pointerCurrentX - pointerLastX;
            var pointerChangeY = pointerCurrentY - pointerLastY;

            targetX += pointerChangeX * multiplier;
            targetY += pointerChangeY * multiplier;

            if (bounce) {
                let diff = checkBounds();
                if (diff.x !== 0) {
                    targetX -= pointerChangeX * dragOutOfBoundsMultiplier(diff.x) * multiplier;
                }
                if (diff.y !== 0) {
                    targetY -= pointerChangeY * dragOutOfBoundsMultiplier(diff.y) * multiplier;
                }
            } else {
                checkBounds(true);
            }

            callUpdateCallback();

            pointerLastX = pointerCurrentX;
            pointerLastY = pointerCurrentY;
            ticking = false;
        }


        /**
         * Returns a value from around 0.5 to 1, based on distance
         * @param {Number} val
         */
        function dragOutOfBoundsMultiplier(val) {
            return 0.000005 * Math.pow(val, 2) + 0.0001 * val + 0.55;
        }


        /**
         * prevents animating faster than current framerate
         */
        function requestTick() {
            if (!ticking) {
                requestAnimFrame(updateAndRender);
            }
            ticking = true;
        }


        /**
         * Determine position relative to bounds
         * @param {Boolean} restrict Whether to restrict target to bounds
         */
        function checkBounds(restrict) {
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
        }


        /**
         * Initialize animation of values coming to a stop
         */
        function startDecelAnim() {
            var firstPoint = trackingPoints[0];
            var lastPoint = trackingPoints[trackingPoints.length - 1];

            var xOffset = lastPoint.x - firstPoint.x;
            var yOffset = lastPoint.y - firstPoint.y;
            var timeOffset = lastPoint.time - firstPoint.time;

            var D = (timeOffset / 15) / multiplier;

            decVelX = (xOffset / D) || 0; // prevent NaN
            decVelY = (yOffset / D) || 0;

            var diff = checkBounds();

            callStartDeceleratingCallback();
            if ((Math.abs(decVelX) > 1 || Math.abs(decVelY) > 1) || !diff.inBounds){
                decelerating = true;
                requestAnimFrame(stepDecelAnim);
            } else {
                callEndDeceleratingCallback();
            }
        }


        /**
         * Animates values slowing down
         */
        function stepDecelAnim() {
            if (!decelerating) {
                return;
            }

            decVelX *= friction;
            decVelY *= friction;

            targetX += decVelX;
            targetY += decVelY;

            var diff = checkBounds();

            if ((Math.abs(decVelX) > stopThreshold || Math.abs(decVelY) > stopThreshold) || !diff.inBounds) {

                if (bounce) {
                    let reboundAdjust = 2.5;

                    if (diff.x !== 0) {
                        if (diff.x * decVelX <= 0) {
                            decVelX += diff.x * bounceDeceleration;
                        } else {
                            let adjust = (diff.x > 0) ? reboundAdjust : -reboundAdjust;
                            decVelX = (diff.x + adjust) * bounceAcceleration;
                        }
                    }
                    if (diff.y !== 0) {
                        if (diff.y * decVelY <= 0) {
                            decVelY += diff.y * bounceDeceleration;
                        } else {
                            let adjust = (diff.y > 0) ? reboundAdjust : -reboundAdjust;
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
                callEndDeceleratingCallback();
            }
        }
    }
}



/**
 * @see http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
 */
const requestAnimFrame = (function(){
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(callback) {
        window.setTimeout(callback, 1000 / 60);
    };
})();


function getPassiveSupported() {
    let passiveSupported = false;

    try {
        var options = Object.defineProperty({}, "passive", {
            get: function() {
                passiveSupported = true;
            }
        });

        window.addEventListener("test", null, options);
    } catch(err) {}

    getPassiveSupported = () => passiveSupported;
    return passiveSupported;
}
