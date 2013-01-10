/**
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 * Moravian Library 2012 (www.mzk.cz)
 */

goog.provide('mzk.html5trans.webgl.MixingTransformation');

goog.require('mzk.html5trans.transforms.Transformation');



/**
 * This transformation is intended for use in combination with WebGLOverlayMix.
 * It is not easily usable without it.
 * @param {!mzk.html5trans.transforms.Transformation} transA .
 * @param {!mzk.html5trans.transforms.Transformation} transB .
 * @extends {mzk.html5trans.transforms.Transformation}
 * @constructor
 */
mzk.html5trans.webgl.MixingTransformation = function(transA, transB) {
  /**
   * @type {!mzk.html5trans.transforms.Transformation}
   * @private
   */
  this.transA_ = transA;

  /**
   * @type {!mzk.html5trans.transforms.Transformation}
   * @private
   */
  this.transB_ = transB;

  /**
   * @type {number}
   */
  this.mix = 0.5;
};
goog.inherits(mzk.html5trans.webgl.MixingTransformation,
              mzk.html5trans.transforms.Transformation);


/**
 * @inheritDoc
 */
mzk.html5trans.webgl.MixingTransformation.prototype.fromMetersToPixel =
    function(meters) {

  var fromA = this.transA_.fromMetersToPixel(meters);
  var fromB = this.transB_.fromMetersToPixel(meters);

  var x_ = goog.math.lerp(fromA.x, fromB.x, this.mix);
  var y_ = goog.math.lerp(fromA.y, fromB.y, this.mix);

  return new google.maps.Point(x_, y_);
};


/**
 * @inheritDoc
 */
mzk.html5trans.webgl.MixingTransformation.prototype.getVertexShader =
    function(opt_suff) {

  var suff = opt_suff || '';

  return this.transA_.getVertexShader(/*'a' + */ suff) +
         'vec2 dstA' + suff + '=dst;' +
         this.transB_.getVertexShader('b' + suff) +
         'dst=mix(dstA' + suff + ',dst,uMix);';
};


/**
 * @inheritDoc
 */
mzk.html5trans.webgl.MixingTransformation.prototype.getAveragePixelSize =
    function() {
  //Do not use this.mix_ here. This value is used statically
  return (this.transA_.getAveragePixelSize() +
          this.transB_.getAveragePixelSize()) / 2;
};


/**
 * @inheritDoc
 */
mzk.html5trans.webgl.MixingTransformation.prototype.getRequiredSubdiv =
    function() {
  var fromA = this.transA_.getRequiredSubdiv();
  var fromB = this.transB_.getRequiredSubdiv();

  var x_ = Math.max(fromA[0], fromB[0]);
  var y_ = Math.max(fromA[1], fromB[1]);

  return [x_, y_];
};
