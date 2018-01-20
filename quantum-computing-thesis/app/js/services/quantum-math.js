'use strict';


angular.module('mbqc.services.quantum-math', []).
    factory('quantumMath', function ()
    {
        var VALID_QUBIT_EPSILON = 0.00001;

        function mod2Add(x, y) {
            return 0 + (x == 1 && y == 0 || x == 0 && y == 1);
        }

        function Complex(re, im) {
            this.real = re;
            this.imag = im;
            this.assignTo = function(c) {
                this.real = c.real;
                this.imag = c.imag;
                return this;
            };
            this.assign = function(newre, newim) {
                this.real = newre;
                this.imag = newim;
                return this;
            };
            // scale by a real number
            this.scale = function(k) {
                this.real = k*this.real;
                this.imag = k*this.imag;
                return this;
            };
            // TODO: scale by a complex number
            this.conjugate = function() {
                this.imag = -this.imag;
                return this;
            };
            this.addTo = function(c) {
                return new Complex(this.real*c.real, this.imag*c.imag)
            };
            this.addWith = function(c) {
                this.real += c.real;
                this.imag += c.imag;
            };
            this.mult = function(c) {
                return new Complex(this.real*c.real - this.imag*c.imag, this.real*c.imag + this.imag*c.real)
            };
            this.multWith = function(c) {
                var oldre = this.real, oldim = this.imag;
                this.real = oldre*c.real - oldim*c.imag;
                this.imag = oldre*c.imag + oldim*c.real;
            };
            this.lengthSquared = function() {
                return (this.real)*(this.real) + (this.imag)*(this.imag);
            };
            this.clone = function() {
                return new Complex(this.real, this.imag);
            }
        }

        function ComplexFactory() {
            this.zero = function() {return new Complex(0,0);};
            this.one = function() {return new Complex(1,0);};
            this.i = function() {return new Complex(0,1);};
            this.minusone = function() {return new Complex(-1,0);};
            this.minusi = function() {return new Complex(0,-1);};
            this.rexp = function(r, alpha) {return new Complex(r*Math.cos(alpha),r*Math.sin(alpha))};
            this.exp = function(alpha) {return this.rexp(1,alpha)};
        }
        var cf = new ComplexFactory();



        // ||v||^2 = <v,v>
        function vectorLengthSquared(v) {
            var sum = 0;
            for (var i = 0, l = v.length; i < l; i++) {
                sum += v[i].lengthSquared();
            }
            return sum;
        }

        // r := v1 tensor v2
        function vectorTensor(v1, v2) {
            var r = [];
            for (var i = 0, l1 = v1.length; i < l1; i++) {
                for (var j = 0, l2 = v2.length; j < l2; j++) {
                    r[i*l2 + j] = v1[i].mult(v2[j]);
                }
            }
            return r;
        }

        // v1 := v1 tensor v2
        function vectorTensorWith(v1, v2) {
            for (var i = 0, l1 = v1.length; i < l1; i++) {
                for (var j = 0, l2 = v1.length; j < l2; j++) {
                    v1[i*l2 + j].multWith(v2[j]);
                }
            }
        }


        function matrixClone(m) {
            var r = [];
            for (var i = 0, l1 = m.length; i < l1; i++) {
                r[i] = [];
                for (var j = 0, l2 = m[i].length; j < l2; j++) {
                    r[i][j] = m[i][j].clone();
                }
            }
            return r;
        }

        // r := m1 tensor m2
        function matrixTensor(m1, m2) {
            var r = [];
            var r1 = m1.length, c1 = m1[0].length;
            var r2 = m2.length, c2 = m2[0].length;

            for (var i = 0, m = r1*r2; i < m; i++) {
                r[i] = [];
                for (var j = 0, n = c1*c2; j < n; j++) {
                    r[i][j] = m1[~~(i/r2)][~~(j/c2)].mult(m2[i%r2][j%c2]);
                }
            }
            return r;
        }

        function vectorlog(v) {
            console.log('Vector log:');
            for (var i = 0, l = v.length; i < l; i++) {
                console.log(['|',v[i].real,'+',v[i].imag,'i|'].join(''));
            }
        }

        function matrixlog(m) {
            console.log('Matrix log:');
            for (var i = 0, l1 = m.length; i < l1; i++) {
                var row = ['|'];
                for (var j = 0, l2 = m[i].length; j < l2; j++) {
                    row.push.apply(row, [m[i][j].real,'+',m[i][j].imag,'i']);
                    if (j != l2 -1 ) row.push.apply(row, [',']);
                }
                row.push.apply(row, ['|']);
                console.log(row.join(''));
            }
        }
/*
        // m1 := m1 tensor m2
        function matrixTensorWith(m1, m2) {
            var r1 = m1.length, c1 = m1[0].length;
            var r2 = m2.length, c2 = m2[0].length;

            for (var i = 0, m = r1*r2; i < m; i++) {
                if (i >= r1) { m1[i] = [];}
                for (var j = 0, n = c1*c2; j < n; j++) {
                    m[i][j] = m1[~~(i/r2)][~~(j/c2)].mult(m2[i%r2][j%c2]);
                }
            }
            return m;
        }

        // m1 := m2 tensor m1
        function matrixTensorWith2(m1, m2) {
            var r1 = m1.length, c1 = m1[0].length;
            var r2 = m2.length, c2 = m2[0].length;

            for (var i = 0, m = r1*r2; i < m; i++) {
                if (i >= r1) { m1[i] = [];}
                for (var j = 0, n = c1*c2; j < n; j++) {
                    m[i][j] = m2[~~(i/r2)][~~(j/c2)].mult(m1[i%r2][j%c2]);
                }
            }
            return m;
        }*/

        // r := m1 * m2
        function matrixMultiply(m1, m2) {
            var r = [];
            var r1 = m1.length, c1 = m1[0].length;
            var r2 = m2.length, c2 = m2[0].length;

            for (var i = 0; i < r1; i++) {
                for (var j = 0; j < c2; j++) {
                    var sum = new Complex(0,0);
                    for (var k = 0; k < r2; j++) {
                        sum.addWith(r[i][k].mult(r[k][j]));
                    }
                    r[i][j] = sum;
                }
            }
            return r;
        }


        // r := m * v
        function matrixVectorMultiply(m, v) {
            var r = [];
            for (var i = 0, l = v.length; i < l; i++) {
                var sum = new Complex(0,0);
                for (var k = 0; k < l; k++) {
                    sum.addWith(m[i][k].mult(v[k]));
                }
                r[i] = sum;
            }
            return r;
        }


        // m1 := m1 + m2
        function matrixAddWith(m1, m2) {
            for (var i = 0, l1 = m1.length; i < l1; i++) {
                for (var j = 0, l2 = m1[i].length; j < l2; j++) {
                    m1[i][j].addWith(m2[i][j]);
                }
            }
        }


        // r := k.m
        function scaleMatrix(k, m) {
            for (var i = 0, l1 = m.length; i < l1; i++) {
                for (var j = 0, l2 = m[i].length; j < l2; j++) {
                    m[i][j].scale(k);
                }
            }
            return m;
        }

        // r := k.v
        function scaleVector(k, v) {
            for (var i = 0, l1 = v.length; i < l1; i++) {
                v[i].scale(k);
            }
            return v;
        }

        // >> daggerMatrix
        // computes the conjugate transpose of matrix m
        // pre: m must be a square matrix
        // NOTE: this function was written in a style that avoids *creating new objects*
        function daggerMatrix(m)
        {
            // flip the upper triangle with the lower triangle
            for (var i = 0, l1 = m.length; i < l1; i++) {
                for (var j = 0, l2 = m[i].length; j < l2; j++) {
                    var tempre = m[i][j].real, tempim = m[i][j].imag;
                    m[i][j].assignTo(m[j][i]).conjugate();
                    m[j][i].assign(tempre, tempim).conjugate();
                }
            }
            return m;
        }

        function isValidRegister(c) {
            var sum = 0;
            for (var i = 0, l = c.length; i < l; i++) {
                sum += c[i].lengthSquared;
            }
            return Math.abs(sum - 1) < VALID_QUBIT_EPSILON;
        }
        function isValidQubit(c) {
            return isValidRegister(c);
        }

        // >> plusMeasureMatrix, minusMeasureMatrix
        // functions for returning the measurement matrices, [M_1, M_2] for the measurement
        // basis B = {|+_alpha>, |-_alpha>}, the basis {|+>,|->} rotated by alpha
        function plusMeasureMatrix(angle) {
            return scaleMatrix(0.5, [[cf.one(),cf.exp(angle)],[cf.exp(angle),cf.exp(2*angle)]]);
        }
        function minusMeasureMatrix(angle) {
            return scaleMatrix(0.5, [[cf.one(),cf.rexp(-1,angle)],[cf.rexp(-1,angle),cf.exp(2*angle)]]);
        }

        // Perform gaussian elimination over the field GF(2) aka F2 = (ℤ_2,+_2,x_2)
        // m must be a a mxn matrix
        // b must be an array of length n
        // rows must = m, cols must = n,
        // x must be an array of zeros of length n
        // --------------------------------------------------------------
        function gaussianOverF2(m, b, rows, cols, x)
        {
            var rowsAdded = {};
            var i,j;
            var pivotRows = [];
            var pivotCols = [];

            // contruct the *augmented matrix*, mb = [A | b]
            // ---------------------------------------------
            var mbRows = rows, mbCols = cols+1;
            var mb = Array.apply(null, new Array(rows)).map(function() {return []});
            for (i = 0; i < rows; i++) {
                for (j = 0; j < cols; j++) {
                    mb[i][j] = m[i][j];
                }
                mb[i][cols] = b[i];
            }

            // Gauss-Jordan Elimination, find rref([A|b])
            // ------------------------------------------
            var augRank = 0;
            for (j = 0; j < mbCols; j++) {
                for (i = 0; i < mbRows; i++) {
                    if (rowsAdded[i] == undefined && mb[i][j] == 1)
                    {
                        //echelon.push(m[i].slice(0));
                        rowsAdded[i] = true;
                        augRank++;
                        pivotRows.push(i); pivotCols.push(j);
                        //
                        for (var r = 0; r < mbRows; r++)
                        {
                            // Eliminate all non-zero elements in column j except the pivot element, m[i][j]
                            // We eliminate by adding row i to r, m[r] := m[r] + m[i] (mod 2)
                            if (r != i && mb[r][j] == 1) {
                                for (var c = 0; c < mbCols; c++) {
                                    mb[r][c] = mod2Add(mb[r][c], mb[i][c]);
                                }
                            }
                        }
                        break;
                    }
                }
            }

            // How many solutions do we have? To answer this, we first compute the rank.
            // We count how many non-zero rows there are for the rref matrix
            // -------------------------------------------------------------
            var coeffRank = 0;
            for (i = rows-1; i >= 0; i--) {
                // scan row i (right-to-left) for a nonzero entry
                // if we find one, increment rank, and move up and scan row i-1
                for (j = cols-1; j >= 0; j--) {
                    if (mb[i][j] == 1) {
                        coeffRank++;
                        break;
                    }
                }
            }

            // Rouché–Capelli theorem:
            // any system of linear equations is inconsistent (has no solutions) iff rank(rref[A|b]) > rank(rref(A))
            if (augRank > coeffRank) {
                // no solution...
                return false;
            } else {
                // there is a solution...
                // use the pivots to find solution
                for (var k = 0; k < augRank; k++) {
                    x[pivotCols[k]] = mb[pivotRows[k]][cols];
                }
                return true;
            }

            /*if (echelon.length == rows)
            {
                // perform back substitution
                x = Array.apply(null, new Array(cols)).map(Number.prototype.valueOf,0);
                for (i = rows - 1; i >= 0; i--) {
                    x[i] = b[i];
                    for (j = i + 1; j < rows; j++) {
                        x[i] = mod2Add(x[i], m[i][j] * x[j]);
                    }
                }
                return true;
            } else {
                return false;
            }*/

        }

        function VectorFactory() {
            this.zero = function() { return [cf.one(), cf.zero()]; };
            this.one = function() { return [cf.zero(), cf.one()]; };
            this.plus = function() { var r = [cf.one(), cf.one()]; return scaleVector(1/Math.sqrt(2), r); };
            this.minus = function() { var r = [cf.one(), cf.minusone()]; return scaleVector(1/Math.sqrt(2), r); }
            this.plusAlpha = function(a) { var r = [cf.one(), cf.minusone()]; return scaleVector(1/Math.sqrt(2), r); }
        }
        var vf = new VectorFactory();

        return {
            mod2Add : mod2Add,
            Complex: Complex,
            complexFactory: cf,
            vectorFactory: vf,
            vectorLengthSquared: vectorLengthSquared,
            vectorTensor: vectorTensor,
            vectorTensorWith: vectorTensorWith,
            matrixClone: matrixClone,
            matrixMultiply: matrixMultiply,
            //matrixMultiplyWith: matrixMultiplyWith,
            matrixVectorMultiply: matrixVectorMultiply,
            //matrixVectorMultiplyWith: matrixVectorMultiplyWith,
            matrixTensor: matrixTensor,
            //matrixTensorWith: matrixTensorWith,
            //matrixTensorWith2: matrixTensorWith2,
            matrixAddWith: matrixAddWith,
            scaleVector: scaleVector,
            scaleMatrix: scaleMatrix,
            daggerMatrix: daggerMatrix,
            isValidRegister: isValidRegister,
            isValidQubit: isValidQubit,
            plusMeasureMatrix: plusMeasureMatrix,
            minusMeasureMatrix: minusMeasureMatrix,
            vectorlog: vectorlog,
            matrixlog: matrixlog,
            gaussianOverF2: gaussianOverF2
        }
    });