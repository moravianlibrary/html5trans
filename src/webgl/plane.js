/**
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 * Moravian Library 2012 (www.mzk.cz)
 */


goog.provide('mzk.html5trans.webgl.Plane');



/**
 * Object representing a plane.
 * @param {!WebGLRenderingContext} gl WebGL context.
 * @param {number} width Width of plane.
 * @param {number} height Height of plane.
 * @param {number=} opt_subdivX Optional horizontal subdivision of the plane.
 * @param {number=} opt_subdivY Optional vertical subdivision of the plane.
 * @constructor
 */
mzk.html5trans.webgl.Plane = function(gl, width, height,
                                      opt_subdivX, opt_subdivY) {
  /**
   * @type {!WebGLBuffer}
   */
  this.vertexBuffer = /** @type {!WebGLBuffer} */(gl.createBuffer());

  /**
   * @type {!WebGLBuffer}
   */
  this.texCoordBuffer = /** @type {!WebGLBuffer} */(gl.createBuffer());

  /**
   * @type {!WebGLBuffer}
   */
  this.indexBuffer = /** @type {!WebGLBuffer} */(gl.createBuffer());

  var subdivX = opt_subdivX || 1;
  var subdivY = opt_subdivY || subdivX;

  var vertices = [], coords = [], ids = [];

  for (var y = 0; y <= subdivY; ++y) {
    for (var x = 0; x <= subdivX; ++x) {
      vertices.push(width * x / subdivX);
      vertices.push(height * y / subdivY);

      coords.push(x / subdivX);
      coords.push(y / subdivY);
    }
  }
  var index = 0;
  for (var y = 0; y < subdivY; ++y) {
    for (var x = 0; x <= subdivX; ++x) {
      ids.push(index);
      index += subdivX + 1;
      ids.push(index);
      index -= subdivX;
      if (y % 2 == 1) index -= 2;
    }
    index += subdivX;
    if (y % 2 == 1) index += 2;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  this.vertexBuffer.itemSize = 2;

  gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coords), gl.STATIC_DRAW);
  this.texCoordBuffer.itemSize = 2;

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ids), gl.STATIC_DRAW);

  /**
   * @type {number}
   */
  this.numIndices = ids.length;
};
