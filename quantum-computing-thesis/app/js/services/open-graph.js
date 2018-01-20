'use strict';


angular.module('mbqc.services.open-graph', [])
    .factory('openGraph', ['pattern', 'QubitIO', function (pattern, qio)
    {


        function buildGraph(pat, adj, edges)
        {
            //var adj = {};

            // work out vertices
            for (var q in pat.qubits) {
                if (pat.qubits.hasOwnProperty(q)) {
                    adj[q] = [];
                }
            }

            // work out the edges
            for (var i = 0, l = pat.instructions.length; i < l; i++) {
                var instr = pat.instructions[i];
                if (instr instanceof pattern.Entanglement)
                {
                    // we want to draw an edge between i and j
                    var from = instr.qubits[0];
                    var to = instr.qubits[1];

                    // add the edge to the adjacency list
                    if (edges[from] == undefined) edges[from] = [];
                    edges[from].push(to);
                }
            }
        }



        // closure: factory for building raphael render functions
        function buildRender(q, darkcol, clickfn)
        {
            // maps qubitio -> (rect fill, rect stroke, circle fill, circle stroke)
            // we want to give appropriate colours for qubit node's rectangle and circle based on qubit's io
            // --------------------------------------------------------------------------------------------
            var iocolours = {};
            iocolours[qio.Neither] = ["#FFF", "#FFF", darkcol, darkcol];
            iocolours[qio.In] = ["#FFF", darkcol, darkcol, darkcol];
            iocolours[qio.Out] = ["#FFF", "#FFF", "#FFF", darkcol];
            iocolours[qio.InOut] = ["#FFF", darkcol, "#FFF", darkcol];
            var cols = iocolours[q];
            var sz = 25;
            return function (r, n) {
                console.log(r.set().items);
                return r.set().push(
                    r.rect(n.point[0] - sz/2, n.point[1] - sz/2, sz, sz).attr({"fill": cols[0], "stroke": cols[1], "stroke-width": "1px"}))
                    .push(r.text(n.point[0], n.point[1], (n.label || n.id)).attr({"fill": "#000000"}))
                    .push(r.circle(n.point[0], n.point[1], sz/2).attr({"fill": cols[2], "stroke": cols[3], "stroke-width": "1px"})
                    .click(function() {clickfn(n);}));
            };
        }


        function addNode(g, qubit, io, clickfnbuild) {
            g.addNode(qubit, {render: buildRender(io,'#AAA',clickfnbuild(qubit))});
        }

        function prepareGraph(qubits, adj, clickfnbuild)
        {
            var g = new Graph();
            for (var v in adj) {
                if (adj.hasOwnProperty(v)) {
                    addNode(g, v, qubits[v], clickfnbuild);
                }
            }

            for (var i in adj) {
                if (adj.hasOwnProperty(i)) {
                    for (var j = 0, l = adj[i].length; j < l; j++) {
                        g.addEdge(i, adj[i][j]);
                    }
                }
            }
            return g;
        }

        return {
            buildGraph: buildGraph,
            prepareGraph: prepareGraph,
            buildRender: buildRender,
            addNode: addNode
        }


    }]);