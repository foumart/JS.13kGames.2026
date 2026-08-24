/**
 * @fileoverview Explicitly list variables, objects or method whose names should not be mangled by the closer-compiler.
 *
 * @externs
 */


/**
 * Keep canvas roundRect (gets mangled for some reason)
 * @record
 */
CanvasRenderingContext2D.prototype.roundRect

/**
 * Main div
 * @type {!HTMLElement}
 */
var mainDiv

/**
 * gameCanvas
 * @type {!HTMLCanvasElement}
 */
var gameCanvas

/**
 * Left panel - player stats
 * @type {!HTMLElement}
 */
var L

/**
 * Score panel
 * @type {!HTMLElement}
 */
var S

/**
 * Right panel - enemy stats
 * @type {!HTMLElement}
 */
var R

/**
 * overlay
 * @type {!HTMLElement}
 */
var ov

/**
 * msg
 * @type {!HTMLElement}
 */
var msg

/**
 * btnWrap
 * @type {!HTMLElement}
 */
var btnWrap

/**
 * retryBtn
 * @type {!HTMLButtonElement}
 */
var retryBtn

/**
 * nextBtn
 * @type {!HTMLButtonElement}
 */
var nextBtn
