/**
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 * Moravian Library 2012 (www.mzk.cz)
 */

goog.provide('mzk.html5trans.transforms.Basic');

goog.require('mzk.html5trans.transforms.Transformation');



/**
 * Simple transformation that only positions the map by it's bounding box.
 *
 * @param {!Array.<number>} bbox [xmin, ymin, xman, ymax] in lat and lng.
 * @param {number} mapWidth Width of the overlay in pixels.
 * @param {number} mapHeight Height of the overlay in pixels.
 * @extends {mzk.html5trans.transforms.Transformation}
 * @constructor
 */
mzk.html5trans.transforms.Basic = function(bbox, mapWidth, mapHeight) {

  var metersmin = mzk.html5trans.math.geo.LatLngToMeters(bbox[1], bbox[0]);
  var metersmax = mzk.html5trans.math.geo.LatLngToMeters(bbox[3], bbox[2]);

  /**
   * @type {!Array.<number>}
   * @private
   */
  this.bbox_ = [metersmin[0], metersmin[1], metersmax[0], metersmax[1]];

  /**
   * @type {number}
   * @private
   */
  this.mapWidth_ = mapWidth;

  /**
   * @type {number}
   * @private
   */
  this.mapHeight_ = mapHeight;

  /**
   * @type {number}
   * @private
   */
  this.scaleX_ = (this.bbox_[2] - this.bbox_[0]) / this.mapWidth_;

  /**
   * @type {number}
   * @private
   */
  this.scaleY_ = -(this.bbox_[3] - this.bbox_[1]) / this.mapHeight_; //flipped
};
goog.inherits(mzk.html5trans.transforms.Basic,
              mzk.html5trans.transforms.Transformation);


/**
 * @inheritDoc
 */
mzk.html5trans.transforms.Basic.prototype.fromMetersToPixel = function(meters) {

  var x_ = (meters.x - this.bbox_[0]) / this.scaleX_;
  var y_ = (meters.y - this.bbox_[3]) / this.scaleY_;

  return new google.maps.Point(x_, y_);
};


/**
 * @inheritDoc
 */
mzk.html5trans.transforms.Basic.prototype.getVertexShader = function(opt_suff) {
  var fl = function(x) {
    return x.toString(10) + (goog.math.isInt(x) ? '.0' : '');
  };

  var x_ = fl(this.bbox_[0]) + '+' + fl(this.scaleX_) + '*src.x';
  var y_ = fl(this.bbox_[3]) + '+' + fl(this.scaleY_) + '*src.y';
  return 'dst=vec2(' + x_ + ',' + y_ + ');';
};


/**
 * @inheritDoc
 */
mzk.html5trans.transforms.Basic.prototype.getAveragePixelSize = function() {
  var w = this.scaleX_;
  var h = this.scaleY_;

  // 1 pixel in the original overlay image is this many meters
  return Math.sqrt(w * w + h * h) / Math.SQRT2;
};
