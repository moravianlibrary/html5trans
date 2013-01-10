/**
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 * Moravian Library 2012 (www.mzk.cz)
 */

goog.provide('mzk.html5trans.Main');

goog.require('goog.dom');

goog.require('mzk.html5trans.TransformationDemo');



/**
 * @param {!Element} element Element to render the application in.
 * @constructor
 */
mzk.html5trans.Main = function(element) {
  var map = new google.maps.Map(element, {
    zoom: 7,
    center: new google.maps.LatLng(50, 16),
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });

  var data = {
    'pyramid': {'width': 8001, 'height': 6943},
    'cutline': [[1593.0, 1360.0], [1561.0, 2880.0], [713.0, 2848.0],
                [711.0, 5756.0], [1318.0, 5757.0], [1340.0, 5685.0],
                [1627.0, 5649.0], [1745.0, 5583.0], [1852.0, 5584.0],
                [1995.0, 5661.0], [2287.0, 5685.0], [2291.0, 5761.0],
                [2772.0, 5767.0], [2769.0, 6010.0], [5981.0, 6020.0],
                [6085.0, 5642.0], [6157.0, 5569.0], [6147.0, 5382.0],
                [6363.0, 5164.0], [6429.0, 5164.0], [6416.0, 5081.0],
                [6355.0, 5111.0], [6337.0, 4956.0], [6456.0, 4885.0],
                [6449.0, 4833.0], [6568.0, 4785.0], [6605.0, 4693.0],
                [6697.0, 4576.0], [7102.0, 4299.0], [7323.0, 4294.0],
                [7317.0, 1920.0], [6372.0, 1909.0], [6378.0, 1378.0],
                [1593.0, 1360.0]],
    'control_points': [
      {'longitude': 16.6114189, 'latitude': 49.191060299999997,
        'pixel_x': 3693.0, 'pixel_y': 4382.0},
      {'longitude': 17.2518043, 'latitude': 49.5955023,
        'pixel_x': 4459.0, 'pixel_y': 3198.0},
      {'longitude': 15.8799192, 'latitude': 49.2158467,
        'pixel_x': 2320.0, 'pixel_y': 4415.0},
      {'longitude': 17.971553799999999, 'latitude': 49.471759800000001,
        'pixel_x': 5748.0, 'pixel_y': 3262.0},
      {'longitude': 16.880739800000001, 'latitude': 48.760207899999997,
        'pixel_x': 4541.0, 'pixel_y': 5474.0},
      {'longitude': 17.902458200000002, 'latitude': 49.938762699999998,
        'pixel_x': 5581.0, 'pixel_y': 1882.0},
      {'longitude': 17.704502099999999, 'latitude': 50.089508100000003,
        'pixel_x': 5020.0, 'pixel_y': 1653.0},
      {'longitude': 16.6116277, 'latitude': 49.911973799999998,
        'pixel_x': 3135.0, 'pixel_y': 2392.0},
      {'longitude': 15.7193068, 'latitude': 49.487093100000003,
        'pixel_x': 1623.0, 'pixel_y': 3936.0},
      {'longitude': 15.590954099999999, 'latitude': 49.395473199999998,
        'pixel_x': 1489.0, 'pixel_y': 4282.0},
      {'longitude': 15.7384083, 'latitude': 49.576639800000002,
        'pixel_x': 1597.0, 'pixel_y': 3548.0},
      {'longitude': 15.456369199999999, 'latitude': 49.182837999999997,
        'pixel_x': 1493.0, 'pixel_y': 4780.0},
      {'longitude': 15.349724200000001, 'latitude': 48.998913100000003,
        'pixel_x': 1431.0, 'pixel_y': 5230.0},
      {'longitude': 18.143974499999999, 'latitude': 49.640194800000003,
        'pixel_x': 6147.0, 'pixel_y': 2722.0},
      {'longitude': 18.635470900000001, 'latitude': 49.749763799999997,
        'pixel_x': 6811.0, 'pixel_y': 2226.0},
      {'longitude': 18.220224328, 'latitude': 50.094691026,
        'pixel_x': 6163.0, 'pixel_y': 1444.0},
      {'longitude': 18.330170500000001, 'latitude': 49.124935600000001,
        'pixel_x': 6959.0, 'pixel_y': 4106.0},
      {'longitude': 18.234886199999998, 'latitude': 48.998573299999997,
        'pixel_x': 6701.0, 'pixel_y': 4520.0},
      {'longitude': 18.037849600000001, 'latitude': 48.893946200000002,
        'pixel_x': 6301.0, 'pixel_y': 4824.0},
      {'longitude': 17.832697100000001, 'latitude': 48.756379500000001,
        'pixel_x': 5883.0, 'pixel_y': 5050.0},
      {'longitude': 17.363957599999999, 'latitude': 48.676524700000002,
        'pixel_x': 5379.0, 'pixel_y': 5800.0},
      {'longitude': 15.225908799999999, 'latitude': 49.530166299999998,
        'pixel_x': 1013.0, 'pixel_y': 3752.0},
      {'longitude': 15.087458, 'latitude': 49.632293400000002,
        'pixel_x': 715.0, 'pixel_y': 3498.0},
      {'longitude': 17.468072841000001, 'latitude': 49.045547341000002,
        'pixel_x': 5187.0, 'pixel_y': 4504.0},
      {'longitude': 16.518485546000001, 'latitude': 49.507314541,
        'pixel_x': 3181.0, 'pixel_y': 3487.0},
      {'longitude': 15.767535686, 'latitude': 50.033928408000001,
        'pixel_x': 1717.0, 'pixel_y': 1975.0},
      {'longitude': 16.160749435, 'latitude': 49.953451711,
        'pixel_x': 2325.0, 'pixel_y': 2229.0},
      {'longitude': 16.312980652, 'latitude': 49.868085860999997,
        'pixel_x': 2651.0, 'pixel_y': 2479.0}],
    'bbox': [14.890233822003262, 48.448805014299587,
             18.929241771154103, 50.364659817309942]};

  var affineTo = [1689149.2243275302, 59.36267641708737, -12.256285781045994,
                  6593535.888605203, -8.479296711327816, -58.26543742413572];

  var polyFrom =
      [422296.1757221371, 0.005807378758004488, -0.13489083702214202,
       2.1323999000511716e-9, 3.7130931747976043e-10, 1.0298118405649414e-8,
       -23016.76480167441, -0.029224835694518066, 0.03450174284767876,
       -1.43295009271471e-9, 5.082651369444473e-9, -4.788523622226865e-9];

  var polyTo =
      [1642075.4909454784, 67.37423713071792, 7.687275666608737,
       -0.0006238769397502706, -0.0007324256756721801, -0.0023340051849909285,
       6573932.131466775, -3.1257378937873215, -53.51439192364624,
       -0.00020002213156092467, -0.0010332789120156578, -0.0000098583330957];

  var image = /** @type {!HTMLImageElement} */(goog.dom.createElement('img'));
  image.crossOrigin = 'anonymous';
  image.onload = goog.bind(function() {
    // RESIZE THE TRANSFORMS
    // the transforms use image with size defined in data['pyramid'],
    //  but we are probably displaying smaller image

    var sizeFactor = data['pyramid']['width'] / image.width;
    var sizeFactor2 = sizeFactor * sizeFactor;
    affineTo[1] *= sizeFactor; affineTo[2] *= sizeFactor;
    affineTo[4] *= sizeFactor; affineTo[5] *= sizeFactor;

    polyFrom[1] *= sizeFactor; polyFrom[2] *= sizeFactor;
    polyFrom[3] *= sizeFactor2; polyFrom[4] *= sizeFactor2;
    polyFrom[5] *= sizeFactor2;
    polyFrom[7] *= sizeFactor; polyFrom[8] *= sizeFactor;
    polyFrom[9] *= sizeFactor2; polyFrom[10] *= sizeFactor2;
    polyFrom[11] *= sizeFactor2;

    polyTo[1] *= sizeFactor; polyTo[2] *= sizeFactor;
    polyTo[3] *= sizeFactor2; polyTo[4] *= sizeFactor2;
    polyTo[5] *= sizeFactor2;
    polyTo[7] *= sizeFactor; polyTo[8] *= sizeFactor;
    polyTo[9] *= sizeFactor2; polyTo[10] *= sizeFactor2;
    polyTo[11] *= sizeFactor2;

    // resize control points and cutline
    var points = [];
    goog.object.forEach(data['control_points'], function(el, i, obj) {
      points.push([el['latitude'], el['longitude'],
        el['pixel_x'] / sizeFactor, el['pixel_y'] / sizeFactor]);
    });

    var cutline = [];
    goog.object.forEach(data['cutline'], function(el, i, obj) {
      cutline.push([el[0] / sizeFactor, el[1] / sizeFactor]);
    });

    // START THE DEMO
    var demo = new mzk.html5trans.TransformationDemo(map, image, data['bbox'],
                                                     affineTo, polyFrom,
                                                     polyTo, points, cutline);
    demo.setOpacity(0.8);
  }, this);
  image.src = (goog.DEBUG ? '../deploy/' : '') + 'komensky.jpg';
};

goog.exportSymbol('mzk.html5trans.Main', mzk.html5trans.Main);
