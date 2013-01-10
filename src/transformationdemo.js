/**
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 * Moravian Library 2012 (www.mzk.cz)
 */

goog.provide('mzk.html5trans.TransformationDemo');
goog.provide('mzk.html5trans.TransformationDemo.Button');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.fx.Animation');

goog.require('mzk.html5trans.transforms.Affine');
goog.require('mzk.html5trans.transforms.Basic');
goog.require('mzk.html5trans.transforms.Polynomial');
goog.require('mzk.html5trans.transforms.TPS');
goog.require('mzk.html5trans.webgl.WebGLOverlay');
goog.require('mzk.html5trans.webgl.WebGLOverlayMix');



/**
 * @param {!google.maps.Map} map .
 * @param {!HTMLImageElement} image .
 * @param {!Array.<number>} bbox [xmin, ymin, xman, ymax].
 * @param {!Array.<number>} affineTo The 6 parameters.
 * @param {!Array.<number>} polyFrom The 6+6 params of the polynomial transform.
 * @param {!Array.<number>} polyTo The 6+6 params of the inverse poly trans.
 * @param {!Array.<Array.<number>>} points Control points (unprojected !)
 *                                        [[lat, lng, rasterX, rasterY], ...].
 * @param {Array.<!Array.<number>>|null=} opt_cutline .
 * @constructor
 */
mzk.html5trans.TransformationDemo = function(map, image, bbox,
                                             affineTo, polyFrom, polyTo,
                                             points, opt_cutline) {
  /**
   * @type {!google.maps.Map}
   * @private
   */
  this.map_ = map;

  /*
  this.map_.fitBounds(
      new google.maps.LatLngBounds(
        new google.maps.LatLng(bbox[1], bbox[0]),
        new google.maps.LatLng(bbox[3], bbox[2])));
  */

  /**
   * @type {!HTMLImageElement}
   * @private
   */
  this.image_ = image;

  /**
   * @type {!Array.<number>}
   * @private
   */
  this.bbox_ = bbox;

  /**
   * @type {!Array.<Array.<number>>}
   * @private
   */
  this.points_ = [];

  /**
   * @type {!Array.<!Array.<number>>}
   * @private
   */
  this.oldMapPoints_ = [];

  /**
   * @type {!Array.<!google.maps.Marker>}
   * @private
   */
  this.newMapMarkers_ = [];

  var icon = new google.maps.MarkerImage(
      mzk.html5trans.TransformationDemo.PNG_MARKER,
      new google.maps.Size(12, 12),
      new google.maps.Point(0, 0),
      new google.maps.Point(6, 6));

  goog.array.forEach(points, function(el, i, arr) {
    var meters = mzk.html5trans.math.geo.LatLngToMeters(el[0], el[1]);
    var gcp = [meters[0], meters[1], el[2], el[3]];
    this.points_.push(gcp);

    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(el[0], el[1]),
      icon: icon,
      draggable: false
    });

    this.newMapMarkers_.push(marker);
    this.oldMapPoints_.push([el[2], el[3]]);
  }, this);

  /**
   * @type {boolean}
   * @private
   */
  this.usePoints_ = false;

  /**
   * @type {boolean}
   * @private
   */
  this.useGrid_ = false;

  /**
   * @type {!Array.<!Array.<number>>|null}
   * @private
   */
  this.cutline_ = opt_cutline || null;

  /**
   * @type {number}
   * @private
   */
  this.opacity_ = 1;

  /**
   * @type {boolean}
   * @private
   */
  this.useCutline_ = true;

  /**
   * @type {!HTMLCanvasElement}
   * @private
   */
  this.canvas_ = /** @type {!HTMLCanvasElement} */
      (goog.dom.createDom('canvas', {'style': 'position:absolute;'}));

  /**
   * @type {!HTMLCanvasElement}
   * @private
   */
  this.mixingCanvas_ = /** @type {!HTMLCanvasElement} */
      (goog.dom.createDom('canvas', {'style': 'position:absolute;'}));

  /**
   * @type {!Array.<mzk.html5trans.transforms.Transformation>}
   * @private
   */
  this.transforms_ = [];

  this.transforms_[0] = new mzk.html5trans.transforms.Basic(this.bbox_,
                                                            this.image_.width,
                                                            this.image_.height);

  this.transforms_[1] = new mzk.html5trans.transforms.Affine(
      affineTo[0], affineTo[1], affineTo[2],
      affineTo[3], affineTo[4], affineTo[5]);

  this.transforms_[2] = new mzk.html5trans.transforms.Polynomial(polyTo,
                                                                 polyFrom);

  this.transforms_[3] = new mzk.html5trans.transforms.TPS(this.points_,
                                                          affineTo);

  /**
   * @type {!Array.<mzk.html5trans.TransformationDemo.Button>}
   * @private
   */
  this.buttons_ = [];

  this.buttons_[0] = new mzk.html5trans.TransformationDemo.Button(0,
      this.map_, 'Bounding box', goog.bind(this.animateTo_, this));
  this.buttons_[1] = new mzk.html5trans.TransformationDemo.Button(1,
      this.map_, 'Affine', goog.bind(this.animateTo_, this));
  this.buttons_[2] = new mzk.html5trans.TransformationDemo.Button(2,
      this.map_, 'Polynomial', goog.bind(this.animateTo_, this));
  this.buttons_[3] = new mzk.html5trans.TransformationDemo.Button(3,
      this.map_, 'TPS', goog.bind(this.animateTo_, this));

  var cutlineCheckbox = new mzk.html5trans.TransformationDemo.Checkbox(
      this.map_, this.useCutline_, 'Cutline', goog.bind(function(state) {
        this.useCutline_ = state;
        this.recreateOverlays_();
      }, this));

  var gcpCheckbox = new mzk.html5trans.TransformationDemo.Checkbox(
      this.map_, this.usePoints_, 'Control points', goog.bind(function(state) {
        this.usePoints_ = state;
        this.recreateOverlays_();
      }, this));

  var gridCheckbox = new mzk.html5trans.TransformationDemo.Checkbox(
      this.map_, this.useGrid_, 'Grid', goog.bind(function(state) {
        this.useGrid_ = state;
        this.recreateOverlays_();
      }, this));

  /**
   * @type {mzk.html5trans.webgl.WebGLOverlay}
   * @private
   */
  this.currentOverlay_ = null;

  /**
   * @type {mzk.html5trans.webgl.WebGLOverlay}
   * @private
   */
  this.mixingOverlay_ = null;

  /**
   * @type {goog.fx.Animation}
   * @private
   */
  this.mixingAnimation_ = null;

  /**
   * @type {mzk.html5trans.transforms.Transformation}
   * @private
   */
  this.currentTransformation_ = null;

  /**
   * @type {mzk.html5trans.transforms.Transformation}
   * @private
   */
  this.targetTransformation_ = null;

  this.buttons_[1].setActive(true);
  this.recreateOverlays_();
};


/**
 * @type {number}
 */
mzk.html5trans.TransformationDemo.ANIMATION_DURATION = 800;


/**
 * @type {string}
 */
mzk.html5trans.TransformationDemo.PNG_MARKER = 'data:image/png;base64,' +
    'iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMBAMAAACkW0HUAAAAJFBMVEUAlf////8iIiIiIiIi' +
    'IiIjIyMjIyMgKC0aOU8HfNEzMzMiIiImsPcUAAAAC3RSTlOqALY1/ISF9+e3BUeSvXcAAAA9' +
    'SURBVAjXYxAUTlIzFGSQCtle7bqQQXTHBM7uQAaTBgYGDmeG7AkMDJzbGNQZgKAIRkEFoUqg' +
    'GqDaIYYBAPRgEhHWrv5pAAAAAElFTkSuQmCC';


/**
 * Sets the new opacity value [0,1].
 * @param {number} opacity [0,1].
 */
mzk.html5trans.TransformationDemo.prototype.setOpacity =
    function(opacity) {
  this.opacity_ = opacity;
  if (this.currentOverlay_) this.currentOverlay_.setOpacity(this.opacity_);
  if (this.mixingOverlay_) this.mixingOverlay_.setOpacity(this.opacity_);
};


/**
 * @param {number} dstTransformationNum .
 * @param {boolean=} opt_dontDeactivate Don't deactivate buttons.
 * @return {boolean} True if the operation is valid, false otherwise.
 * @private
 */
mzk.html5trans.TransformationDemo.prototype.animateTo_ =
    function(dstTransformationNum, opt_dontDeactivate) {
  var dstTransformation = this.transforms_[dstTransformationNum];
  if (!dstTransformation) return false;
  if (this.mixingOverlay_) return false;

  var cutline = this.useCutline_ ? this.cutline_ : null;
  var points = this.usePoints_ ? this.oldMapPoints_ : null;
  var grid = this.useGrid_ ? 4 : 0;
  var newOverlay = new mzk.html5trans.webgl.WebGLOverlay(
      this.image_, dstTransformation, cutline, points, grid, this.canvas_);

  if (!this.currentOverlay_ || !this.currentTransformation_) {
    // no overlay set, use the new one immediately
    this.currentTransformation_ = dstTransformation;
    this.currentOverlay_ = newOverlay;
    this.currentOverlay_.setMap(this.map_);
  } else {
    this.targetTransformation_ = dstTransformation;

    this.mixingOverlay_ = new mzk.html5trans.webgl.WebGLOverlayMix(
        this.image_, this.currentTransformation_, this.targetTransformation_,
        cutline, points, grid, this.mixingCanvas_);
    this.mixingOverlay_.setOpacity(0);
    this.mixingOverlay_.setMap(this.map_);

    //in-out quintic
    var supereasing = function(t) {
      var t2 = t * t;
      var t3 = t * t * t;
      return 6 * t3 * t2 + -15 * t2 * t2 + 10 * t3;
    };

    this.mixingAnimation_ = new goog.fx.Animation([0], [1],
        mzk.html5trans.TransformationDemo.ANIMATION_DURATION, supereasing);

    goog.events.listen(this.mixingAnimation_,
        goog.fx.Animation.EventType.ANIMATE, function(e) {
          if (this.mixingOverlay_) {
            this.mixingOverlay_.setMixFactor(e.coords[0]);
          }
        }, false, this);

    goog.events.listen(this.mixingAnimation_,
        goog.fx.Animation.EventType.END, function(e) {
          this.currentTransformation_ = this.targetTransformation_;
          this.targetTransformation_ = null;
          this.currentOverlay_ = newOverlay;
          this.currentOverlay_.setOpacity(0); // mask by hiding the new overlay
          this.currentOverlay_.setMap(this.map_);
          setTimeout(goog.bind(function() {
            // and switching them after a while
            this.currentOverlay_.setOpacity(this.opacity_);
            this.mixingOverlay_.setMap(null);
            this.mixingOverlay_ = null;
            this.mixingAnimation_ = null;
          }, this), 100);
        }, false, this);

    setTimeout(goog.bind(function() {
      this.mixingOverlay_.setOpacity(this.opacity_);
      this.mixingAnimation_.play();
      this.currentOverlay_.setMap(null);
      this.currentOverlay_ = null;
    }, this), 50);
  }

  if (!opt_dontDeactivate) {
    for (var i = 0; i < this.buttons_.length; ++i) {
      this.buttons_[i].setActive(false);
    }
  }
  return true;
};


/**
 * Stops animation, destroys both overlays and recreates them.
 * @private
 */
mzk.html5trans.TransformationDemo.prototype.recreateOverlays_ =
    function() {
  if (this.mixingAnimation_) {
    this.mixingAnimation_.stop(false);
    this.mixingAnimation_ = null;
  }
  if (this.mixingOverlay_) {
    this.mixingOverlay_.setMap(null);
    this.mixingOverlay_ = null;
  }
  if (this.currentOverlay_) {
    this.currentOverlay_.setMap(null);
    this.currentOverlay_ = null;
  }

  var trans = 0;
  for (var i = 0; i < this.buttons_.length; ++i) {
    if (this.buttons_[i].isActive()) {
      trans = i;
      break;
    }
  }
  this.animateTo_(trans, true);

  var map = this.usePoints_ ? this.map_ : null;
  goog.array.forEach(this.newMapMarkers_, function(el, i, arr) {
    el.setMap(map);
  }, this);
};



/**
 * @param {number} transNum .
 * @param {!google.maps.Map} map .
 * @param {string} name .
 * @param {function(number) : boolean} onclick .
 * @constructor
 */
mzk.html5trans.TransformationDemo.Button = function(transNum, map,
                                                    name, onclick) {
  /**
   * @type {!google.maps.Map}
   * @private
   */
  this.map_ = map;

  /**
   * @type {number}
   */
  this.transNum = transNum;

  /**
   * @type {boolean}
   * @private
   */
  this.active_ = false;

  /**
   * @type {!Element}
   */
  this.control = goog.dom.createElement('div');
  this.control.innerHTML = name;

  this.control.className = 'gmaps_button';

  // Wait for the elements to load and then fixate the width to prevent
  //  size changing when setting fontWeight to bold.
  // Even 1 ms waiting time should be enough -- we need to let the events happen
  setTimeout(goog.bind(function() {
    if (this.control.clientWidth > 0) {
      this.control.style.padding = '1px 0';
      this.control.style.width = (this.control.clientWidth + 16) + 'px';
      // + 16 because of 2*8 padding compensation (see .css)
    }
  }, this), 500);

  goog.events.listen(this.control, 'click', function() {
    if (onclick(this.transNum)) {
      this.setActive(true);
    }
  }, false, this);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(this.control);
};


/**
 * @param {boolean} active .
 */
mzk.html5trans.TransformationDemo.Button.prototype.setActive =
    function(active) {
  this.active_ = active;
  if (this.control) this.control.style.fontWeight = active ? 'bold' : 'normal';
};


/**
 * @return {boolean} Is active?
 */
mzk.html5trans.TransformationDemo.Button.prototype.isActive = function() {
  return this.active_;
};



/**
 * @param {!google.maps.Map} map .
 * @param {boolean} state Initial checkbox state.
 * @param {string} name .
 * @param {function(boolean):boolean} onchange .
 * @constructor
 */
mzk.html5trans.TransformationDemo.Checkbox = function(map, state,
                                                      name, onchange) {
  /**
   * @type {!google.maps.Map}
   * @private
   */
  this.map_ = map;

  /**
   * @type {!Element}
   */
  this.checkbox = goog.dom.createDom('input', {'type': 'checkbox'});

  this.checkbox.checked = state;

  /**
   * @type {!Element}
   */
  this.control = goog.dom.createDom('div', {'class': 'gmaps_checkbox'},
                                    this.checkbox, name);

  goog.events.listen(this.control, 'click', function(e) {
    if (e.target != this.checkbox)
      this.checkbox.checked = !this.checkbox.checked;
    onchange(this.checkbox.checked);
  }, false, this);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(this.control);
};
