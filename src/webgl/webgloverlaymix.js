/**
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 * Moravian Library 2012 (www.mzk.cz)
 */

goog.provide('mzk.html5trans.webgl.WebGLOverlayMix');

goog.require('mzk.html5trans.webgl.MixingTransformation');
goog.require('mzk.html5trans.webgl.WebGLOverlay');



/**
 * This is a special variant of WebGLOverlay that lerps two transformations.
 * @param {!HTMLImageElement} image .
 * @param {!mzk.html5trans.transforms.Transformation} transA .
 * @param {!mzk.html5trans.transforms.Transformation} transB .
 * @param {Array.<!Array.<number>>|null=} opt_cutline .
 * @param {Array.<!Array.<number>>|null=} opt_points .
 * @param {number=} opt_addDebugLines .
 * @param {!HTMLCanvasElement=} opt_canvas Canvas to use instead of a new one.
 * @constructor
 * @extends {mzk.html5trans.webgl.WebGLOverlay}
 */
mzk.html5trans.webgl.WebGLOverlayMix = function(image, transA, transB,
                                                opt_cutline, opt_points,
                                                opt_addDebugLines, opt_canvas) {
  goog.base(this,
      image,
      new mzk.html5trans.webgl.MixingTransformation(transA, transB),
      opt_cutline, opt_points, opt_addDebugLines, opt_canvas);

  this.setMixFactor(0);
};
goog.inherits(mzk.html5trans.webgl.WebGLOverlayMix,
              mzk.html5trans.webgl.WebGLOverlay);


/**
 * @param {number} mix Desired mix factor [0,1].
 */
mzk.html5trans.webgl.WebGLOverlayMix.prototype.setMixFactor = function(mix) {
  this.transformation.mix = mix;
  this.context.uniform1f(this.program.uMix, mix);
  this.updateLayers();
};


/**
 * @inheritDoc
 */
mzk.html5trans.webgl.WebGLOverlayMix.prototype.createProgram =
    function(vsCode, fsCode) {

  vsCode = vsCode.replace('//%additional_defs\n', 'uniform float uMix;');

  var program =
      mzk.html5trans.webgl.WebGLOverlayMix.superClass_.createProgram.call(
      this, vsCode, fsCode);

  program.uMix = this.context.getUniformLocation(program, 'uMix');

  return program;
};
