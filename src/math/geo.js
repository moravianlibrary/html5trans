/**
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 * Moravian Library 2012 (www.mzk.cz)
 */

goog.provide('mzk.html5trans.math.geo');



/**
 * @param {number} lat Latitude.
 * @param {number} lng Longitude.
 * @return {!Array.<number>} [metersx, metersy] in spherical mercator.
 * @constructor
 */
mzk.html5trans.math.geo.LatLngToMeters = function(lat, lng) {

  var metersx_ = (lng / 180 * Math.PI);
  var metersy_ = Math.log(Math.tan((lat / 180 * Math.PI) / 2 + Math.PI / 4));

  return [metersx_ * mzk.html5trans.math.geo.EARTH_RADIUS,
          metersy_ * mzk.html5trans.math.geo.EARTH_RADIUS];
};


/**
 * @type {number}
 */
mzk.html5trans.math.geo.EARTH_RADIUS = 6378137;
