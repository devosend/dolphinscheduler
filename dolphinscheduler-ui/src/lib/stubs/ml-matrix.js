/**
 * Stub for ml-matrix to avoid Babel 6 parse failure on ES2021+ syntax.
 * ml-matrix is only used by @antv/layout's MDS layout algorithm which is
 * not actually invoked in this application.
 */

function Matrix () {}
Matrix.prototype.get = function () { return 0 }
Matrix.prototype.set = function () { return this }
Matrix.from2DArray = function () { return new Matrix() }
Matrix.eye = function () { return new Matrix() }

function SingularValueDecomposition () {}
SingularValueDecomposition.prototype.leftSingularVectors = new Matrix()
SingularValueDecomposition.prototype.singularValues = []

module.exports = {
  Matrix: Matrix,
  default: Matrix,
  AbstractMatrix: Matrix,
  SingularValueDecomposition: SingularValueDecomposition
}
