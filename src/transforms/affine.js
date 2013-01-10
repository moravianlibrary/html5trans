/**
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 * Moravian Library 2012 (www.mzk.cz)
 */

goog.provide('mzk.html5trans.transforms.Affine');

goog.require('mzk.html5trans.transforms.Transformation');



/**
 * Class encapsulating actual affine transformation matrix.
 *
 * Initialized by
 *   Affine transformation parameters in EPSG:900913 (spherical mercator)
 *   Example:
 *     GDAL Transform = (preffered for us)
 *       1681682.071594318, 65.99770746270001, -17.399796098
 *       6636281.687453653, -12.6784369153, -64.3884903916
 * @param {number} posx .
 * @param {number} scalex .
 * @param {number} rotx .
 * @param {number} posy .
 * @param {number} roty .
 * @param {number} scaley .
 * @extends {mzk.html5trans.transforms.Transformation}
 * @constructor
 */
mzk.html5trans.transforms.Affine = function(posx, scalex, rotx,
                                            posy, roty, scaley) {

  /**
   * @type {number}
   */
  this.scalex = scalex;

  /**
   * @type {number}
   */
  this.scaley = scaley;

  /**
   * @type {number}
   */
  this.rotx = rotx;

  /**
   * @type {number}
   */
  this.roty = roty;

  /**
   * @type {number}
   */
  this.posx = posx;

  /**
   * @type {number}
   */
  this.posy = posy;
};
goog.inherits(mzk.html5trans.transforms.Affine,
              mzk.html5trans.transforms.Transformation);


/**
 * @inheritDoc
 */
mzk.html5trans.transforms.Affine.prototype.fromMetersToPixel =
    function(meters) {

  // [A B C]
  // [D E F]
  var A = this.scalex, B = this.rotx, C = this.posx;
  var D = this.roty, E = this.scaley, F = this.posy;

  // inv:
  // [E   -B   BF-CE]
  // [-D   A   CD-AF]
  // ----------------
  //    determinant

  var determinant = A * E - B * D;

  var x_ = (E * meters.x - B * meters.y + B * F - C * E) / determinant;
  var y_ = (-D * meters.x + A * meters.y + C * D - A * F) / determinant;

  return new google.maps.Point(x_, y_);
};


/**
 * @param {!google.maps.Point} point .
 * @return {!google.maps.LatLng} LatLng.
 */
mzk.html5trans.transforms.Affine.prototype.fromPixelToLatLng =
    function(point) {
  var x_ = this.scalex * point.x + this.rotx * point.y + this.posx;
  var y_ = this.roty * point.x + this.scaley * point.y + this.posy;

  var x__ = (x_ / mzk.html5trans.math.geo.EARTH_RADIUS);
  var y__ = (y_ / mzk.html5trans.math.geo.EARTH_RADIUS);
  y__ = 2 * Math.atan(Math.exp(y__)) - Math.PI / 2;

  return new google.maps.LatLng(y__ / Math.PI * 180, x__ / Math.PI * 180);
};


/**
 * @inheritDoc
 */
mzk.html5trans.transforms.Affine.prototype.getVertexShader =
    function(opt_suff) {
  var fl = function(x) {
    return x.toString(10) + (goog.math.isInt(x) ? '.0' : '');
  };
  var x_ = fl(this.scalex) + '*src.x+' +
           fl(this.rotx) + '*src.y+' + fl(this.posx);
  var y_ = fl(this.roty) + '*src.x+' +
           fl(this.scaley) + '*src.y+' + fl(this.posy);
  return 'dst=vec2(' + x_ + ',' + y_ + ');';
};


/**
 * @inheritDoc
 */
mzk.html5trans.transforms.Affine.prototype.getAveragePixelSize = function() {
  // [A B] [1] = [A + B]
  // [D E] [1]   [D + E]
  var A = this.scalex, B = this.rotx;
  var D = this.roty, E = this.scaley;

  var w = A + B, h = D + E;

  // 1 pixel in the original overlay image is this many meters
  return Math.sqrt(w * w + h * h) / Math.SQRT2;
};
