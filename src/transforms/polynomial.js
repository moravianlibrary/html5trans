/**
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 * Moravian Library 2012 (www.mzk.cz)
 */

goog.provide('mzk.html5trans.transforms.Polynomial');

goog.require('mzk.html5trans.transforms.Transformation');



/**
 * Class encapsulating polynomial overlay transformation.
 * @param {!Array.<number>} toGeo 6+6 params to translate xy from raster to geo.
 * @param {!Array.<number>} fromGeo 6+6 params to translate from geo to raster.
 * @extends {mzk.html5trans.transforms.Transformation}
 * @constructor
 */
mzk.html5trans.transforms.Polynomial = function(toGeo, fromGeo) {
  /**
   * @type {!Array.<number>}
   */
  this.toGeo = toGeo;

  /**
   * @type {!Array.<number>}
   */
  this.fromGeo = fromGeo;
};
goog.inherits(mzk.html5trans.transforms.Polynomial,
              mzk.html5trans.transforms.Transformation);


/**
 * @inheritDoc
 */
mzk.html5trans.transforms.Polynomial.prototype.fromMetersToPixel =
    function(meters) {

  var a = this.fromGeo;
  var x = meters.x;
  var y = meters.y;
  var x2 = x * x;
  var xy = x * y;
  var y2 = y * y;

  var x_ = a[0] + a[1] * x + a[2] * y + a[3] * x2 + a[4] * xy + a[5] * y2;
  var y_ = a[6] + a[7] * x + a[8] * y + a[9] * x2 + a[10] * xy + a[11] * y2;

  return new google.maps.Point(x_, y_);
};


/**
 * @inheritDoc
 */
mzk.html5trans.transforms.Polynomial.prototype.getVertexShader =
    function(opt_suff) {

  var a = this.toGeo;

  var fl = function(x) {
    return x.toString(10) + (goog.math.isInt(x) ? '.0' : '');
  };
  var x_ = fl(a[0]) + '+' + fl(a[1]) + '*src.x+' + fl(a[2]) + '*src.y+' +
           fl(a[3]) + '*src.x*src.x+' +
           fl(a[4]) + '*src.x*src.y+' +
           fl(a[5]) + '*src.y*src.y';
  var y_ = fl(a[6]) + '+' + fl(a[7]) + '*src.x+' + fl(a[8]) + '*src.y+' +
           fl(a[9]) + '*src.x*src.x+' +
           fl(a[10]) + '*src.x*src.y+' +
           fl(a[11]) + '*src.y*src.y';

  return 'dst=vec2(' + x_ + ',' + y_ + ');';
};


/**
 * @inheritDoc
 */
mzk.html5trans.transforms.Polynomial.prototype.getAveragePixelSize =
    function() {
  //TODO: Something better (transform both diagonals, average, ...)

  // [A B] [1] = [A + B]
  // [D E] [1]   [D + E]
  var A = this.toGeo[1], B = this.toGeo[2];
  var D = this.toGeo[7], E = this.toGeo[8];

  var w = A + B, h = D + E;

  // 1 pixel in the original overlay image is this many meters
  return Math.sqrt(w * w + h * h) / Math.SQRT2;
};


/**
 * @inheritDoc
 */
mzk.html5trans.transforms.Polynomial.prototype.getRequiredSubdiv = function() {
  //TODO: dynamic calculation based on how much "bendy" the transform is
  //      It would be best to have several geometries ready and swap them
  //        depending on the current zoom level.
  return [7, 7];
};
