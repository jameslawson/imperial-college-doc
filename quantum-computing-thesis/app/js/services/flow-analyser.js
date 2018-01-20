'use strict';


angular.module('mbqc.services.flow-analyser', [])
    .factory('flowAnalyser', ['QubitIO', 'quantumMath', 'pattern', function (qio, qm, pat) {

        // Casual Flow Algorithm
        // p6, Finding Optimal Flows Efficiently, Mehdi Mhalla, Simon Perdrix (17/07/2007)
        function flow(qubits, adj)
        {
            // output: the flow function
            var g = {};
            // output: the flow's partial order
            // maps vertex ->> number, where the number is the index of the layer
            // the vertex belong to. We then define u < v iff l(u) < l(v)
            var l = {};

            // we compute numQubits = |V|
            // along with the initial values for out and C
            var numQubits = 0;
            var initialc = [];
            var initialout = [];

            for (var q in qubits) {
                if (qubits.hasOwnProperty(q)) {
                    numQubits++;
                    if (qio.IsOutput(qubits[q])) {
                        l[q] = 0;
                        initialout.push(q);
                    }
                    if (qubits[q] == qio.Out) {
                        initialc.push(q);
                    }
                }
            }

            return [flowAux(initialout, initialc, 1),g,l];


            function flowAux(out, c, k)
            {
                var outprime = [];
                var cprime = [];

                for (var i = 0, n = c.length; i < n; i++) {
                    var v = c[i];
                    // compute N(v) n (V-Out)
                    var intersect = [];
                    for (var j = 0, n2 = adj[v].length; j < n2; j++) {
                        var u = adj[v][j];
                        if (out.indexOf(u) == -1) {
                            intersect.push(u);
                        }
                    }
                    // Check whether v can be removed from C
                    // if |N(v) n (V-Out)| = 1...
                    // then there is some u s.t. N(v) n (V-Out) = {u}
                    if (intersect.length == 1) {
                        u = intersect[0];
                        g[u] = v;
                        l[u] = k;
                        outprime.push(u);
                        cprime.push(v);
                    }
                }


                if (outprime.length == 0) {
                    if (out.length == numQubits) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    // newout = out u out'
                    // (since out and out' are disjoint, we can just use concat for the union)
                    var newout = out.concat(outprime);

                    // newc = (c - cprime) u (outprime n v-in)
                    // since c and outprime are disjoint, (c - cprime) and (outprime n v-in) are disjoint
                    // so we can use 'push' for both cases without worrying about newc having duplicates
                    var newc = [];
                    for (i = 0, n = c.length; i < n; i++) {
                        v = c[i];
                        if (cprime.indexOf(v) == -1) {
                            newc.push(v);
                        }
                    }
                    for (i = 0, n = outprime.length; i < n; i++) {
                        v = outprime[i];
                        if (!qio.IsInput(qubits[v])) {
                            newc.push(v);
                        }
                    }


                    return flowAux(newout, newc, k + 1);
                }
            }
        }

        // ------------------------------------------------------------------------------------
        // ------------------------------------------------------------------------------------
        // ------------------------------------------------------------------------------------

        // General flow algorithm
        // p8, Finding Optimal Flows Efficiently, Mehdi Mhalla, Simon Perdrix (17/07/2007)
        function gflow(qubits, adj)
        {

            // output: the flow function
            var g = {};
            // output: the flow's partial order
            // maps vertex ->> number, where the number is the index of the layer
            // the vertex belong to. We then define u < v iff l(u) < l(v)
            var l = {};

            // we compute numQubits = |V|
            // along with the initial values for out
            var numQubits = 0;
            var initialOut = {}, initialOutSize = 0;

            for (var q in qubits) {
                if (qubits.hasOwnProperty(q)) {
                    numQubits++;
                    if (qio.IsOutput(qubits[q])) {
                        initialOutSize++;
                        initialOut[q] = true;
                        l[q] = 0;
                    }
                }
            }


            return [gflowAux(initialOut, initialOutSize, 1),g,l];

            function gflowAux(out, outsize, k)
            {
                // C := emptyset
                var c = [];

                // compute Out - In
                var nameToColIndex = {}, colIndexToName = {};
                var numCols = 0;
                for (var o in out) {
                    if (out.hasOwnProperty(o)) {
                        if (!qio.IsInput(qubits[o])) {
                            nameToColIndex[o] = numCols;
                            colIndexToName[numCols] = o;
                            numCols++;
                        }
                    }
                }

                // compute V - Out
                var nameToRowIndex = {}, rowIndexToName = {};
                var numRows = 0;
                for (var y in qubits) {
                    if (qubits.hasOwnProperty(y)) {
                        if (out[y] == undefined) {
                            nameToRowIndex[y] = numRows;
                            rowIndexToName[numRows] = y;
                            numRows++;
                        }
                    }
                }

                if (numRows > 0 && numCols > 0) {
                    // create gamma
                    var gamma = [];
                    for (var i = 0; i < numRows; i++) {
                        gamma[i] = Array.apply(null, new Array(numCols)).map(Number.prototype.valueOf,0);
                    }
                    for (var rn in nameToRowIndex) {
                        if (nameToRowIndex.hasOwnProperty(rn)){
                            for (var z = 0, zn = adj[rn].length; z < zn; z++) {
                                var adjnodeIndex = nameToColIndex[adj[rn][z]];
                                if (adjnodeIndex != undefined) {
                                    gamma[nameToRowIndex[rn]][adjnodeIndex] = 1;
                                }
                            }
                        }
                    }

                    for (var u in nameToRowIndex)
                    {
                        if (nameToRowIndex.hasOwnProperty(u))
                        {
                            // Find RHS = the indicator vector for {u}, I_{u}
                            var rhs = Array.apply(null, new Array(numRows)).map(Number.prototype.valueOf,0);
                            rhs[nameToRowIndex[u]] = 1;

                            // perform gaussian elimination to solve linear system: gamma * I_X = I_{u}
                            var x = Array.apply(null, new Array(numRows)).map(Number.prototype.valueOf,0);
                            var success = qm.gaussianOverF2(gamma, rhs, numRows, numCols, x);

                            if (success) {
                                // if there is a solution, X0 ...
                                //
                                c.push(u);
                                // convert the indicator vector for the solution X0, I_{X0}, into X0
                                // g[u] = x;
                                var x0 = [];
                                for (i = 0; i < numRows; i++) {
                                    if (x[i] == 1) {
                                        x0.push(colIndexToName[i]);
                                    }
                                }
                                g[u] = x0;
                            }
                            l[u] = k;
                        }
                    }
                }


                if (c.length == 0) {
                    if (outsize == numQubits) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    for (var r = 0, len = c.length; r < len; r++) {
                        if (out[c[r]] == undefined) {
                            out[c[r]] = true;
                            outsize++;
                        }
                    }
                    return gflowAux(out,outsize,k+1);
                }
            }
        }

        // ------------------------------------------------------------------------------------
        // ------------------------------------------------------------------------------------
        // ------------------------------------------------------------------------------------

        // Return uniform deterministic pattern using gflow
        // see Theorem 11 of Extended Measurement Calculus
        // * alphas is a map: qubitName ->> angleExpression
        function glowToPattern(qubits, adj, l, g, alphas)
        {
            var i, len;

            // Topologically sort the partial order
            // totalOrder orders qubitNames using a total order
            // -------------------------------------------------
            var totalOrder = [];
            for (i in qubits) {
                if (qubits.hasOwnProperty(i)) {
                    if (!qio.IsOutput(qubits[i])) {
                        totalOrder.push(i);
                    }
                }
            }
            totalOrder.sort(
                function (a, b) {
                    if (l(a) > l(b)) return -1;  // a < b
                    if (l(a) < l(b)) return 1;  // a > b
                    return 0;
                }
            );

            var instructions = [];

            // We perform the product over the partial order
            // We consider all i in V-O in a total order
            // ------------------------------------------------------
            for (var t = 0, tLen = totalOrder.length; t < tLen; t++)
            {
                i = totalOrder[t];
                if (!qio.IsOutput(qubits[i]))
                {
                    len = g[i].length;
                    for (var jIdx = 0; jIdx < len; jIdx++)
                    {
                        // Add XZ instruction for all j in g(i)
                        // --------------------------------------------------------------
                        var j = g[i][jIdx];
                        instructions.push(new pat.XCorrection(j, [i]));
                        for (var nj = 0, njLen = adj[j].length; nj < njLen; nj++) {
                            var jNeighbour = adj[j][nj];
                            if (jNeighbour != i) {
                                instructions.push(new pat.ZCorrection(jNeighbour, [i]));
                            }
                        }
                        // Add M instruction, to measure i
                        // -------------------------------------------------
                        instructions.push(new pat.Measurement(i, alphas[i]));
                    }
                }
            }

            // Add E_G, entangle qubits according to edges of G
            // ---------------------------------------------------------------
            var edges = {}, u, v;
            for (u in adj) {
                if (adj.hasOwnProperty(u)) {
                    edges[u] = {};
                }
            }
            for (u in adj) {
                if (adj.hasOwnProperty(u)) {
                    for (v in adj) {
                        if (adj.hasOwnProperty(v)) {
                            if (edges[u][v] == undefined) {
                                instructions.push(new pat.Entanglement(u, v));
                                edges[u][v] = true; edges[v][u] = true;
                            }
                        }
                    }
                }
            }

            // Prepare all the non-input qubits
            // -------------------------------------------------
            for (var p in qubits) {
                if (qubits.hasOwnProperty(p)) {
                    if (!qio.IsInput(qubits[p])) {
                        instructions.push(new pat.Prepare(p));
                    }
                }
            }
        }


        return {
            flow: flow,
            gflow: gflow
        }


    }]);