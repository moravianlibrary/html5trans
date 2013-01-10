/**
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 * Moravian Library 2012 (www.mzk.cz)
 */

goog.provide('mzk.html5trans.transforms.TPS');

goog.require('mzk.html5trans.math.Spline2D');
goog.require('mzk.html5trans.transforms.Transformation');



/**
 * Class encapsulating ThinPlateSpline overlay transformation.
 * @param {!Array.<Array.<number>>} points Control points
 *                                        [[geoX, geoY, rasterX, rasterY], ...].
 * @param {!Array.<number>} affineTo The 6 params of the affine transform
 *                                   for pixel size calculation.
 * @extends {mzk.html5trans.transforms.Transformation}
 * @constructor
 */
mzk.html5trans.transforms.TPS = function(points, affineTo) {
  /**
   * @type {!Array.<Array.<number>>}
   */
  this.points = points;

  /**
   * @type {!Array.<number>}
   */
  this.affineTo = affineTo;

  /**
   * @type {!mzk.html5trans.math.Spline2D}
   */
  this.toGeo = new mzk.html5trans.math.Spline2D(points, 2, 3, 0, 1);

  /**
   * @type {!mzk.html5trans.math.Spline2D}
   */
  this.fromGeo = new mzk.html5trans.math.Spline2D(points, 0, 1, 2, 3);
};
goog.inherits(mzk.html5trans.transforms.TPS,
              mzk.html5trans.transforms.Transformation);


/**
 * @inheritDoc
 */
mzk.html5trans.transforms.TPS.prototype.fromMetersToPixel = function(meters) {
  var a = this.fromGeo.getPoint(meters.x, meters.y);

  return new google.maps.Point(a[0], a[1]);
};


/**
 * @inheritDoc
 */
mzk.html5trans.transforms.TPS.prototype.getVertexShader = function(opt_suff) {
  return this.toGeo.createShader('src.x', 'src.y', opt_suff);
};


/**
 * @inheritDoc
 */
mzk.html5trans.transforms.TPS.prototype.getAveragePixelSize = function() {
  //TODO: Something better !!

  // [A B] [1] = [A + B]
  // [D E] [1]   [D + E]
  var A = this.affineTo[1], B = this.affineTo[2];
  var D = this.affineTo[4], E = this.affineTo[5];

  var w = A + B, h = D + E;

  // 1 pixel in the original overlay image is this many meters
  return Math.sqrt(w * w + h * h) / Math.SQRT2;
};


/**
 * @inheritDoc
 */
mzk.html5trans.transforms.TPS.prototype.getRequiredSubdiv = function() {
  //TODO: dynamic calculation based on how much "bendy" the transform is
  //      It would be best to have several geometries ready and swap them
  //        depending on the current zoom level.
  return [15, 15];
};
