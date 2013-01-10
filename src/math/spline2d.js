/**
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 * Moravian Library 2012 (www.mzk.cz)
 */

goog.provide('mzk.html5trans.math.Spline2D');

goog.require('goog.array');
goog.require('goog.math');



/**
 * @param {!Array.<!Array.<number>>} data Data points.
 * @param {number} xIndex Index of x sample values in data.
 * @param {number} yIndex Index of y sample values in data.
 * @param {number} v1Index Index of first var.
 * @param {number} v2Index Index of second var.
 * @constructor
 */
mzk.html5trans.math.Spline2D = function(data,
                                        xIndex, yIndex, v1Index, v2Index) {
  /**
   * @type {!Array.<number>}
   * @private
   */
  this.x_ = [];

  /**
   * @type {!Array.<number>}
   * @private
   */
  this.y_ = [];

  var rhs = [[0, 0, 0], [0, 0, 0]];

  var addPoint = goog.bind(function(x, y, v1, v2) {
    this.x_.push(x);
    this.y_.push(y);
    rhs[0].push(v1);
    rhs[1].push(v2);
  }, this);

  goog.array.forEach(data, function(el, i, arr) {
    addPoint(el[xIndex], el[yIndex], el[v1Index], el[v2Index]);
  });

  /**
   * @type {!number}
   */
  this.numPoints = data.length;

  /**
   * @type {!Array.<number>}
   * @private
   */
  this.coef_ = [];

  /**
   * @type {number}
   */
  this.status = -1;

  if (this.numPoints < 3) {
    return;
  } else {
    // More than 2 points - first we have to check if it is 1D or 2D case
    var xmax = this.x_[0], xmin = this.x_[0];
    var ymax = this.y_[0], ymin = this.y_[0];
    var sumx = 0, sumy = 0, sumx2 = 0, sumy2 = 0, sumxy = 0;

    for (var i = 0; i < this.numPoints; i++) {
      var xx = this.x_[i];
      var yy = this.y_[i];

      xmin = Math.min(xmin, xx);
      ymin = Math.min(ymin, yy);
      xmax = Math.max(xmax, xx);
      ymax = Math.max(ymax, yy);

      sumx += xx;
      sumy += yy;
      sumx2 += xx * xx;
      sumxy += xx * yy;
      sumy2 += yy * yy;
    }
    var delx = xmax - xmin;
    var dely = ymax - ymin;

    var SSxx = sumx2 - sumx * sumx / this.numPoints;
    var SSyy = sumy2 - sumy * sumy / this.numPoints;
    var SSxy = sumxy - sumx * sumy / this.numPoints;

    if ((delx < 0.0001 * dely) || (dely < 0.0001 * delx) ||
        Math.abs((SSxy * SSxy) / (SSxx * SSyy)) > 0.999) {
      // only one-dimensional -> we do not support that
      // TODO: this could probably be easily supported as well
      return;
    } else {
      // Make the necessary memory allocations

      var createMatrix = function(m, n) {
        var mat = [];
        for (var i = 0; i < m; i++) {
          mat[i] = goog.array.repeat(0, n);
        }
        return mat;
      };

      var numEqs = this.numPoints + 3;

      var AA = createMatrix(numEqs, numEqs);
      var Ainv = createMatrix(numEqs, numEqs);
      this.coef_[0] = new Array(numEqs);
      this.coef_[1] = new Array(numEqs);

      // Calc the values of the matrix A
      /*for (var r = 0; r < 3; r++)
        for (var c = 0; c < 3; c++)
          AA[r][c] = 0;*/

      for (var c = 0; c < this.numPoints; c++) {
        AA[0][c + 3] = 1;
        AA[1][c + 3] = this.x_[c];
        AA[2][c + 3] = this.y_[c];

        AA[c + 3][0] = 1;
        AA[c + 3][1] = this.x_[c];
        AA[c + 3][2] = this.y_[c];
      }

      for (var r = 0; r < this.numPoints; r++) {
        for (var c = r; c < this.numPoints; c++)
        {
          AA[r + 3][c + 3] = this.baseFunc_(this.x_[r], this.y_[r],
              this.x_[c], this.y_[c]);
          if (r != c) AA[c + 3][r + 3] = AA[r + 3][c + 3];
        }
      }

      // Invert the matrix
      Ainv = mzk.html5trans.math.Spline2D.inv(AA);

      // calc the coefs
      for (var v = 0; v < 2; v++) {
        for (var r = 0; r < numEqs; r++) {
          this.coef_[v][r] = 0;
          for (var c = 0; c < numEqs; c++)
            this.coef_[v][r] += Ainv[r][c] * rhs[v][c];
        }
      }

      this.status = 1;
      return;
    }
  }
};


/**
 * @param {number} x1 .
 * @param {number} y1 .
 * @param {number} x2 .
 * @param {number} y2 .
 * @return {number} .
 * @private
 */
mzk.html5trans.math.Spline2D.prototype.baseFunc_ = function(x1, y1, x2, y2) {
  if ((x1 == x2) && (y1 == y2))
    return 0;

  var diffx = x2 - x1, diffy = y2 - y1;
  var dist = diffx * diffx + diffy * diffy;

  return dist * Math.log(dist);
};


/**
 * Transforms given point.
 * @param {number} Px x-coordinate.
 * @param {number} Py y-coordinate.
 * @return {!Array.<number>} [x, y].
 */
mzk.html5trans.math.Spline2D.prototype.getPoint = function(Px, Py) {
  var vars = [0, 0];

  if (this.status > 0) {
    for (var v = 0; v < 2; v++)
      vars[v] = this.coef_[v][0] +
                this.coef_[v][1] * Px +
                this.coef_[v][2] * Py;

    for (var r = 0; r < this.numPoints; r++) {
      var tmp = this.baseFunc_(Px, Py, this.x_[r], this.y_[r]);
      for (var v = 0; v < 2; v++)
        vars[v] += this.coef_[v][r + 3] * tmp;
    }
  }
  return vars;
};


/**
 * Generates a code for (slightly modified version of) getPoint()
 * to be executed in glsl vertex shader.
 * @param {string} Px Name of the shader variable holding the value of X.
 * @param {string} Py Name of the shader variable holding the value of Y.
 * @param {string=} opt_suff Optional suffix for possible shader variables.
 *                             Used to solve problems in shaders with 2 trans.
 * @return {string} Final shader fragment.
 */
mzk.html5trans.math.Spline2D.prototype.createShader = function(Px, Py,
                                                               opt_suff) {

  var fl = function(x) {
    return x.toString(10) + (goog.math.isInt(x) ? '.0' : '');
  };

  var suff = opt_suff || '';
  var shdr = '';

  if (this.status > 0) {
    var vars = ['', ''];
    for (var v = 0; v < 2; v++)
      vars[v] = 'v' + suff + v + '=' + fl(this.coef_[v][0]) + '+' +
                fl(this.coef_[v][1]) + '*' + Px + '+' +
                fl(this.coef_[v][2]) + '*' + Py;

    shdr += 'float dx' + suff + ',dy' + suff + ',d' + suff + ',' +
            vars[0] + ',' + vars[1] + ';';
    for (var r = 0; r < this.numPoints; r++) {
      //var tmp = this.baseFunc_(Px, Py, this.x_[r], this.y_[r]);
      shdr += 'dx' + suff + '=' + fl(this.x_[r]) + '-' + Px + ';';
      shdr += 'dy' + suff + '=' + fl(this.y_[r]) + '-' + Py + ';';
      shdr += 'd' + suff + '=dx' + suff + '*dx' + suff +
              '+dy' + suff + '*dy' + suff + ';';
      shdr += 'if(d' + suff + '>.0){';
      for (var v = 0; v < 2; v++)
        shdr += 'v' + suff + v + '+=' + fl(this.coef_[v][r + 3]) +
                '*d' + suff + '*log(d' + suff + ');';
      shdr += '}';
    }
    shdr += 'dst=vec2(v' + suff + '0,v' + suff + '1);';
  }
  return shdr;
};


/**
 * Calculates matrix inversion.
 * @param {!Array.<!Array.<number>>} orig Original matrix.
 * @return {!Array.<!Array.<number>>} orig^-1.
 */
mzk.html5trans.math.Spline2D.inv = function(orig) {
  var createIdentity = function(m) {
    var result = [];
    for (var r = 0; r < m; r++) {
      var row = [];
      for (var c = 0; c < m; c++) {
        row.push((r == c) ? 1 : 0);
      }
      result.push(row);
    }
    return result;
  };
  var cloneMatrix = function(A) {
    var result = [];
    for (var r = 0; r < A.length; r++) {
      var row = [];
      for (var c = 0; c < A[r].length; c++) {
        row.push(A[r][c]);
      }
      result.push(row);
    }
    return result;
  };

  var m = orig.length, n = orig[0].length;
  var A = cloneMatrix(orig), Aj;
  var I = createIdentity(m), Ij;
  var k;
  for (var j = 0; j < n; ++j) {
    var i0 = -1;
    var v0 = -1;
    for (var i = j; i !== m; ++i) {
      k = Math.abs(A[i][j]);
      if (k > v0) {
        i0 = i;
        v0 = k;
      }
    }
    Aj = A[i0]; A[i0] = A[j]; A[j] = Aj;
    Ij = I[i0]; I[i0] = I[j]; I[j] = Ij;
    var x = Aj[j];
    for (k = j; k !== n; ++k) Aj[k] /= x;
    for (k = n - 1; k !== -1; --k) Ij[k] /= x;
    for (var i = m - 1; i !== -1; --i) {
      if (i !== j) {
        var Ai = A[i];
        var Ii = I[i];
        x = Ai[j];
        for (k = j + 1; k !== n; ++k) Ai[k] -= Aj[k] * x;
        for (k = n - 1; k > 0; --k) {
          Ii[k] -= Ij[k] * x;
          --k;
          Ii[k] -= Ij[k] * x;
        }
        if (k === 0) Ii[0] -= Ij[0] * x;
      }
    }
  }
  return I;
};
