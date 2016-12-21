/**
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 * Moravian Library 2012 (www.mzk.cz)
 */

goog.provide('mzk.html5trans.webgl.WebGLOverlay');

goog.require('goog.dom');
goog.require('goog.style');

goog.require('mzk.html5trans.math.geo');
goog.require('mzk.html5trans.webgl.Plane');



/**
 * This is a general class for WebGL-based map overlays.
 * @param {!HTMLImageElement} image .
 * @param {!mzk.html5trans.transforms.Transformation} transformation .
 * @param {Array.<!Array.<number>>|null=} opt_cutline .
 * @param {Array.<!Array.<number>>|null=} opt_points .
 * @param {number=} opt_addDebugLines .
 * @param {!HTMLCanvasElement=} opt_canvas Canvas to use instead of a new one.
 * @constructor
 * @extends {google.maps.OverlayView}
 */
mzk.html5trans.webgl.WebGLOverlay = function(image, transformation,
                                             opt_cutline, opt_points,
                                             opt_addDebugLines,
                                             opt_canvas) {
  /**
   * @type {!HTMLCanvasElement}
   * @private
   */
  this.canvas_ = /** @type {!HTMLCanvasElement} */
      (opt_canvas ||
      goog.dom.createDom('canvas', {'style': 'position:absolute;'}));


  var contextOpts = {
    'depth': false,
    'preserveDrawingBuffer': true,
    'premultipliedAlpha': true};

  /**
   * @type {!WebGLRenderingContext}
   * @protected
   */
  this.context = /** @type {!WebGLRenderingContext} */
                 (this.canvas_.getContext('webgl', contextOpts) ||
                 this.canvas_.getContext('experimental-webgl', contextOpts));
  var gl = this.context;

  /**
   * @type {number}
   * @private
   */
  this.canvasPadding_ = 128;

  /**
   * @type {!HTMLImageElement}
   * @protected
   */
  this.image = image;

  /**
   * @type {Array.<!Array.<number>>|null}
   * @private
   */
  this.cutline_ = opt_cutline || null;

  /**
   * @type {number}
   * @private
   */
  this.debugLines_ = opt_addDebugLines || 0;

  /**
   * @type {Array.<!Array.<number>>|null}
   * @private
   */
  this.points_ = opt_points || null;

  this.textureWidth_ = 0;
  this.textureHeight_ = 0;

  /** @type {?WebGLTexture} */
  this.texture = null;

  this.recreateTexture_(1);

  /**
   * @type {!mzk.html5trans.transforms.Transformation}
   * @protected
   */
  this.transformation = transformation;

  var vsCode = mzk.html5trans.webgl.WebGLOverlay.VERTEX_SHADER.replace(
      '%transform%', this.transformation.getVertexShader());

  /**
   * @type {!WebGLProgram}
   * @protected
   */
  this.program = this.createProgram(vsCode,
      mzk.html5trans.webgl.WebGLOverlay.FRAGMENT_SHADER);

  gl.useProgram(this.program);
  gl.activeTexture(gl.TEXTURE0);
  gl.uniform1i(this.program.uTex, 0);

  var subdiv = transformation.getRequiredSubdiv();

  /**
   * @type {!mzk.html5trans.webgl.Plane}
   * @private
   */
  this.plane_ = new mzk.html5trans.webgl.Plane(gl,
      this.textureWidth_,
      this.textureHeight_,
      subdiv[0], subdiv[1]);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.plane_.vertexBuffer);
  gl.vertexAttribPointer(this.program.aPos,
      this.plane_.vertexBuffer.itemSize,
      gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.plane_.texCoordBuffer);
  gl.vertexAttribPointer(this.program.aTC,
      this.plane_.texCoordBuffer.itemSize,
      gl.FLOAT, false, 0, 0);

  /**
   * @type {number}
   * @private
   */
  this.opacity_ = 1;

  /**
   * @type {boolean}
   * @private
   */
  this.zooming_ = false;
};
goog.inherits(mzk.html5trans.webgl.WebGLOverlay, google.maps.OverlayView);


/**
 * @const {string}
 */
mzk.html5trans.webgl.WebGLOverlay.VERTEX_SHADER =
    'precision lowp float;' +
    'attribute vec2 aPos;' +
    'attribute vec2 aTC;' +
    'varying vec2 vTC;' +
    // uOffset should be meter coordinates of top left corner of the canvas
    'uniform vec2 uOffset;' +
    'uniform vec2 uScale;' +
    '//%additional_defs\n' +
    'void main(){' +
    //src are pixel coordinates in the original overlay image
    'vec2 src=aPos;' +
    'vec2 dst;' +
    '%transform%' +
    'dst=(dst-uOffset)*uScale;' +
    'gl_Position=vec4(dst.x-1.0,dst.y+1.0,.0,1.0);' +
    'vTC=aTC;}';


/**
 * @const {string}
 */
mzk.html5trans.webgl.WebGLOverlay.FRAGMENT_SHADER =
    'precision lowp float;' +
    'uniform sampler2D uTex;' +
    'varying vec2 vTC;' +
    'void main(){gl_FragColor=texture2D(uTex,vTC);}';


/**
 * @param {number} opacity Opacity value [0,1] for whole layer.
 */
mzk.html5trans.webgl.WebGLOverlay.prototype.setOpacity = function(opacity) {
  this.opacity_ = opacity;
  goog.style.setOpacity(this.canvas_, this.opacity_);
};


/**
 * @this {mzk.html5trans.webgl.WebGLOverlay}
 */
mzk.html5trans.webgl.WebGLOverlay.prototype['onAdd'] = function() {
  var map = this.getMap();
  var panes = this.getPanes();
  if (goog.isDefAndNotNull(panes)) {
    goog.dom.appendChild(panes.overlayLayer, this.canvas_);
    goog.style.setPosition(this.canvas_,
                           -this.canvasPadding_, -this.canvasPadding_);
  }

  google.maps.event.addListener(
      map, 'resize', goog.bind(this.handleResize, this));

  this.handleResize();

  var redrawHandler = goog.bind(function() {
    if (this.zooming_) return;
    var off = goog.style.getRelativePosition(this.canvas_,
                                             /** @type {Element} */ (map.getDiv()));
    if (Math.max(Math.abs(off.x + this.canvasPadding_),
                 Math.abs(off.y + this.canvasPadding_)) > this.canvasPadding_) {
      this.updateLayers();
    }
  }, this);

  this.zooming_ = false;

  google.maps.event.addListener(map, 'drag', redrawHandler);
  google.maps.event.addListener(map, 'zoom_changed', goog.bind(function() {
    //window['console']['log']('zoom_changed');
    this.zooming_ = true;
    goog.style.setElementShown(this.canvas_, false);
    setTimeout(goog.bind(function() {
      this.zooming_ = false;
      this.updateLayers();
    }, this), 800);
  }, this));
  this.updateLayers();
};


/**
 * @this {mzk.html5trans.webgl.WebGLOverlay}
 */
mzk.html5trans.webgl.WebGLOverlay.prototype['draw'] = function() {

};


/**
 * Updates the layers (checks for zoom change and updates layer bounds)
 */
mzk.html5trans.webgl.WebGLOverlay.prototype.updateLayers = function() {
  if (this.zooming_) return;
  var map = this.getMap();
  if (!map) return;
  var div = /** @type {?Element} */ (map.getDiv());
  if (!div) return;
  //window['console']['log']('Repositioning canvas...');
  var panes = this.getPanes();
  if (!panes) return;
  var offOver = goog.style.getRelativePosition(div,
      /** @type {?Element} */ (panes.overlayLayer));
  //window['console']['log'](offOver.x + ',' + offOver.y + '!!');
  goog.style.setPosition(this.canvas_,
                         offOver.x - this.canvasPadding_,
                         offOver.y - this.canvasPadding_);
  goog.style.setElementShown(this.canvas_, true);

  var bnds = map.getBounds();
  if (bnds) {
    this.updateBounds(bnds);
  }
};


/**
 * @param {!google.maps.LatLngBounds} bnds .
 */
mzk.html5trans.webgl.WebGLOverlay.prototype.updateBounds = function(bnds) {
  //TODO:
  var zoomLevel = this.getMap().getZoom();

  var gl = this.context;
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(this.program);
  //window['console']['log']('clearing');


  var latlng = /** @type {!google.maps.LatLng} */
      (this.getProjection().fromContainerPixelToLatLng(
          new google.maps.Point(-this.canvasPadding_, -this.canvasPadding_)));
  var meters = this.transformation.fromLatLngToMeters(latlng);
  gl.uniform2fv(this.program.uOffset, new Float32Array([meters.x, meters.y]));

  var scaleToNew = 1 / (mzk.html5trans.math.geo.EARTH_RADIUS * Math.PI);
  scaleToNew *= 256 << zoomLevel;

  gl.uniform2fv(this.program.uScale, new Float32Array(
      [scaleToNew / this.canvas_.width,
       scaleToNew / this.canvas_.height]));

  gl.bindTexture(gl.TEXTURE_2D, this.texture);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.plane_.indexBuffer);
  gl.drawElements(gl.TRIANGLE_STRIP, this.plane_.numIndices,
                  gl.UNSIGNED_SHORT, 0);
};


/**
 * @param {!number} zoomFactor .
 * @private
 */
mzk.html5trans.webgl.WebGLOverlay.prototype.recreateTexture_ =
    function(zoomFactor) {

  var nearestHigherPOT = function(x) {
    return Math.pow(2, Math.ceil(Math.log(x) / Math.log(2)));
  };

  this.textureWidth_ = nearestHigherPOT(this.image.width);
  this.textureHeight_ = nearestHigherPOT(this.image.height);
  var iWidth = this.image.width, iHeight = this.image.height;

  var canvasProxy_ = /** @type {!HTMLCanvasElement} */
      (goog.dom.createDom('canvas'));

  var canvasProxyContext_ = /** @type {CanvasRenderingContext2D} */
      (canvasProxy_.getContext('2d'));

  var ctx = canvasProxyContext_;
  canvasProxy_.width = this.textureWidth_;
  canvasProxy_.height = this.textureHeight_;

  ctx.save();
  if (this.cutline_) {
    var cutline = this.cutline_;
    ctx.moveTo((cutline[0][0]) / zoomFactor,
               (cutline[0][1]) / zoomFactor);

    var l = cutline.length;
    for (var i = 1; i < l; i++) {
      ctx.lineTo((cutline[i][0]) / zoomFactor,
                 (cutline[i][1]) / zoomFactor);
    }
    ctx.closePath();
    ctx.clip();
  }
  ctx.drawImage(this.image, 0, 0);
  ctx.restore();

  if (this.debugLines_ > 0) {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, iWidth, iHeight);
    if (this.debugLines_ > 1) {
      ctx.beginPath();
      ctx.lineWidth = 1;
      var doLine = function(x1, y1, x2, y2) {
        ctx.moveTo(x1 * iWidth, y1 * iHeight);
        ctx.lineTo(x2 * iWidth, y2 * iHeight);
      };
      for (var i = 1; i < this.debugLines_; i++) {
        var p = i / this.debugLines_;
        doLine(p, 0, p, 1);
        doLine(0, p, 1, p);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }

  if (this.points_) {
    ctx.strokeStyle = '#222';
    ctx.fillStyle = '#6f2';
    ctx.lineWidth = 8;
    var l = this.points_.length;
    for (var i = 0; i < l; i++) {
      var x = (this.points_[i][0]) / zoomFactor;
      var y = (this.points_[i][1]) / zoomFactor;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, 7 /* >2PI */, false);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    }
  }

  var gl = this.context;
  this.texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, this.texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                gl.RGBA, gl.UNSIGNED_BYTE, canvasProxy_);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
};


/**
 * Resizes the canvas.
 */
mzk.html5trans.webgl.WebGLOverlay.prototype.handleResize = function() {
  var map = this.getMap();
  if (!map) return;
  var div = /** @type {?Element} */ (map.getDiv());
  if (!div) return;
  var size = goog.style.getSize(div);
  this.canvas_.width = size.width + 2 * this.canvasPadding_;
  this.canvas_.height = size.height + 2 * this.canvasPadding_;
  this.context.viewport(0, 0, this.canvas_.width, this.canvas_.height);
};


/**
 * @param {string} vsCode Vertex shader code.
 * @param {string} fsCode Fragment shader code.
 * @return {!WebGLProgram} Compiled WebGL program.
 * @protected
 */
mzk.html5trans.webgl.WebGLOverlay.prototype.createProgram = function(vsCode,
                                                                     fsCode) {
  var gl = this.context;

  var vs = gl.createShader(gl.VERTEX_SHADER);
  var fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(vs, vsCode);
  gl.shaderSource(fs, fsCode);
  gl.compileShader(vs);
  gl.compileShader(fs);
  //window['console']['log']('Info: ' + gl.getShaderInfoLog(vs));
  //window['console']['log']('Info: ' + gl.getShaderInfoLog(fs));

  var program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, 'aPos');
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    window['console']['log']('Shader program err: ' +
                             gl.getProgramInfoLog(program));
  }
  program.aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(program.aPos);
  program.aTC = gl.getAttribLocation(program, 'aTC');
  gl.enableVertexAttribArray(program.aTC);
  program.uTex = gl.getUniformLocation(program, 'uTex');
  program.uOffset = gl.getUniformLocation(program, 'uOffset');
  program.uScale = gl.getUniformLocation(program, 'uScale');

  return /** @type {!WebGLProgram} */(program);
};


/**
 * @this {mzk.html5trans.webgl.WebGLOverlay}
 */
mzk.html5trans.webgl.WebGLOverlay.prototype['onRemove'] = function() {
  goog.dom.removeNode(this.canvas_);
};
