/**
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 * Moravian Library 2012 (www.mzk.cz)
 */

goog.provide('mzk.html5trans.transforms.Transformation');

goog.require('mzk.html5trans.math.geo');



/**
 * Abstract class describing overlay image transformation.
 * @constructor
 */
mzk.html5trans.transforms.Transformation = function() {};


/**
 * Regular transformation needed:
 *   We are transforming single tile (per-vertex) from it's original position.
 *
 * Prepares part of the GLSL shader code responsible for vertex transformation.
 * @param {string=} opt_suff Optional suffix to append to variable names, if
 *                           the resulting shader creates some extra variables.
 *                           Needed for MixingTransform.
 * @return {string} GLSL vertex shader code.
 */
mzk.html5trans.transforms.Transformation.prototype.getVertexShader =
    goog.abstractMethod;


/**
 * @param {!goog.math.Coordinate} meters .
 * @return {!google.maps.Point} Pixel coordinates in the overlay image.
 */
mzk.html5trans.transforms.Transformation.prototype.fromMetersToPixel =
    goog.abstractMethod;


/**
 * Inverse transformation needed:
 *   We need to determine which pixel will be transformed TO the given location.
 *
 * @param {!google.maps.LatLng} latlng .
 * @return {!google.maps.Point} Pixel coordinates in the overlay image.
 */
mzk.html5trans.transforms.Transformation.prototype.fromLatLngToPixel =
    function(latlng) {
  return this.fromMetersToPixel(this.fromLatLngToMeters(latlng));
};


/**
 * @param {!google.maps.LatLng} latlng .
 * @return {!goog.math.Coordinate} Easting and northing.
 */
mzk.html5trans.transforms.Transformation.prototype.fromLatLngToMeters =
    function(latlng) {

  var meters_ = mzk.html5trans.math.geo.LatLngToMeters(latlng.lat(),
      latlng.lng());

  return new goog.math.Coordinate(meters_[0], meters_[1]);
};


/**
 * @return {number} Average pixel size after transformation in meters
 *                  (1 pixel in the original overlay image is this many meters).
 */
mzk.html5trans.transforms.Transformation.prototype.getAveragePixelSize =
    goog.abstractMethod;


/**
 * @return {Array.<number>} [subdivX, subdivY].
 */
mzk.html5trans.transforms.Transformation.prototype.getRequiredSubdiv =
    function() {
  return [1, 1];
};
