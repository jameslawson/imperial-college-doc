'use strict';


angular.module('mbqc.controllers.simulatorCtrl', [])
    .controller('SimulatorCtrl', ['$scope', '$rootScope', 'pattern', 'QubitIO', 'predefinedPatterns', 'simulation', 'quantumMath',
        'expressionTree', 'simulationLogger',
        function ($scope, $rootScope, pattern, qubitio, predefinedPatterns, sim, qm, et, simlog)
        {

            $scope.pattern = null;
            $scope.showBuilder = true;
            $scope.showDataInput = false;
            $scope.showDataInput = false;
            var f = qm.complexFactory;
            var vf = qm.vectorFactory;
            var controllerRef = this;
            $scope.nonTrivialAnglesExist = false;
            $scope.inputQubitsExist = false;
            $scope.highlights = [];
            $scope.signal = "";

            // ------------------------------------------------------------------------
            $scope.patternTabsHidden = {
                simulationLog: true,
                computationTree: true,
                entanglementGraph: true,
                statistics: true
            };
            $scope.togglePatternTab = function(name) {
                $scope.patternTabsHidden[name] = !$scope.patternTabsHidden[name];
                for (var tab in $scope.patternTabsHidden) {
                    if ($scope.patternTabsHidden.hasOwnProperty(tab)) {
                        if (tab != name) {
                            $scope.patternTabsHidden[tab] = true;
                        }
                    }
                }
            };


            // ------------------------------------------------------------------------


            $scope.numActiveQubits = 0;


            $scope.$on('buildAccepted', function (event, pat) {
                //$scope.pattern = pat;
                //$scope.buildDiagram();
                //$scope.drawDiagram();

                $scope.pattern = pat;
                //var inputstate = [f.one(), f.one()];

                //var inputstate = qm.vectorTensor([f.zero(),f.one()], [f.minusone(),f.zero()]);
                //qm.scaleVector(1/Math.sqrt(2), inputstate);



                // go through the pattern and find all the angle identifiers which need a binding
                // ------------------------------------------------------------------------------
                var angleContext = {};
                $scope.nonTrivialAnglesExist = false;
                for (var i = 0, n = $scope.pattern.instructions.length; i < n; i++) {
                    if ($scope.pattern.instructions[i] instanceof pattern.Measurement) {
                        angleSearch($scope.pattern.instructions[i].angle)
                    }
                }
                function angleSearch(root) {
                    if (root == undefined) return;
                    if (root instanceof et.IdentifierNode) {
                        var identifier = root.identifier;
                        if (identifier != 'x' && identifier != 'π') {
                            $scope.nonTrivialAnglesExist = true;
                            angleContext[root.identifier] = 0;
                        }
                    } else {
                        angleSearch(root.l);
                        angleSearch(root.r);
                    }
                }
                $scope.angleContext = angleContext;


                // go through all the qubits and find all that need an input to be given by user
                // ----------------------------------------------------------------------------
                var inputQubitState = {}, inputQubits = {};
                $scope.inputQubitsExist = false;
                for (var q in $scope.pattern.qubits) {
                    if ($scope.pattern.qubits.hasOwnProperty(q)) {
                        if (qubitio.IsInput($scope.pattern.qubits[q])) {
                            $scope.inputQubitsExist = true;
                            inputQubitState[q] = [f.one(), f.zero()];
                            //inputQubits[q] = $scope.pattern.qubits[q];
                        }
                    }
                }
                $scope.inputQubitState = inputQubitState;
                //$scope.inputQubits = inputQubits;


                $scope.showBuilder = false;
                $scope.showDataInput = true;
                $scope.showSimulator = false;
            });

            $scope.dataInputGoBack = function() {
                $scope.showBuilder = true;
                $scope.showDataInput = false;
                $scope.showSimulator = false;
            };

            function setInputTo(state) {
                return function (q){
                    if ($scope.showDataInput) {
                        $scope.inputQubitState[q] = state;
                    }
                };
            }
            $scope.setInputToZero = setInputTo(vf.zero());
            $scope.setInputToOne = setInputTo(vf.one());
            $scope.setInputToPlus = setInputTo(vf.plus());
            $scope.setInputToMinus = setInputTo(vf.minus());



            $scope.dataInputAccept = function()
            {
                // TODO: check correctness of input data (e.g. all qubits are qubits)
                sim.begin($scope.pattern, $scope.angleContext, $scope.inputQubitState, simlog);
                $scope.showBuilder = false;
                $scope.showDataInput = false;
                $scope.showSimulator = true;
                //
                $scope.numActiveQubits = sim.numActiveQubits;
                resetHighlights();
                updateScope();
            };

            function resetHighlights() {
                for (var i = 0; i < $scope.pattern.instructions.length; i++) {
                     $scope.highlights[i] = false;
                }
            }

            /**********************************************/

            $scope.runNext = function() {
                $scope.highlights[sim.currentInstrIndex] = false;
                sim.next();
                console.log(sim.state);
                updateScope();
                controllerRef.updateBranchTree();
            };

            $scope.runAll = function() {
                sim.runAll();
                resetHighlights();
                updateScope();
                controllerRef.updateBranchTree && controllerRef.updateBranchTree();
            };

            // Update primitive values
            function updateScope() {
                $scope.numActiveQubits = sim.numActiveQubits;
                $scope.highlights[sim.currentInstrIndex] = true;
                $scope.quantumState = sim.state;
                $scope.measurementOutcomes = sim.outcomeMap;
                $scope.tensorOrder = sim.indexToName;
                $scope.commentary = simlog.commentary;
                $scope.signal = sim.signal;
            }

            $scope.onDomLoad = function() {
                onDomLoad();
            };

            function buildTreeData(data, startIdx, signal) {
                var instrs = $scope.pattern.instructions;
                var parent = signal == "" ? "null" : signal.slice(1);
                //var past = startIdx > sim.currentInstrIndex;
                // recursive case
                for (var i = startIdx; i >=0; i--) {
                    if (instrs[i] instanceof pattern.Measurement) {
                        var q = instrs[i].qubits[0];
                        data.push({ "name" : signal, "parent":parent, label:"M"+q});
                        buildTreeData(data, i-1, 0+signal);
                        buildTreeData(data, i-1, 1+signal);
                        break;
                    }
                }
                // base case
                if (i < 0 && signal != "") {
                    data.push({ "name" : signal, "parent":parent, label:signal});
                }
            }



            function onDomLoad()
            {
                /*var data = [
                    { "name" : "M0", "parent":"null" },
                    { "name" : "M1", "parent":"M0" },
                    { "name" : "M2", "parent":"M1" },
                    { "name" : "M2", "parent":"M1" },
                    { "name" : "M1", "parent":"M0" },
                    { "name" : "M2", "parent":"M1" },
                    { "name" : "M2", "parent":"M1" }
                ];*/

                var data = [];
                buildTreeData(data, $scope.pattern.instructions.length, "");

                // *********** Convert flat data into a nice tree ***************
                // create a name: node map
                var dataMap = data.reduce(function(map, node) {
                    map[node.name] = node;
                    return map;
                }, {});

                // create the tree array
                var treeData = [];
                data.forEach(function(node) {
                    // add to parent
                    var parent = dataMap[node.parent];
                    if (parent) {
                        // create child array if it doesn't exist
                        (parent.children || (parent.children = []))
                            // add node to child array
                            .push(node);
                    } else {
                        // parent is null or missing
                        treeData.push(node);
                    }
                });

                // ************** Generate the tree diagram	 *****************
                var margin = {top: 20, right: 120, bottom: 20, left: 120},
                    width = 600 - margin.right - margin.left,
                    height = 300 - margin.top - margin.bottom;

                var i = 0;

                var tree = d3.layout.tree()
                    .size([height, width]);

                var diagonal = d3.svg.diagonal()
                    .projection(function(d) { return [width-d.y, d.x]; });

                var svg = d3.select("div#branch-diagram").append("svg")
                    .attr("width", width + margin.right + margin.left)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                var root = treeData[0];

                controllerRef.updateBranchTree = function(source) {

                    // Compute the new tree layout.
                    var nodes = tree.nodes(root).reverse(),
                        links = tree.links(nodes);

                    // Normalize for fixed-depth.
                    nodes.forEach(function(d) { d.y = d.depth * 100; });

                    // Declare the nodes…
                    var node = svg.selectAll("g.node")
                        .data(nodes, function(d) { return d.id || (d.id = ++i); });

                    // Enter the nodes.
                    var nodeEnter = node.enter().append("g")
                        .attr("class", "node")
                        .attr("transform", function(d) {
                            return "translate(" + (width-d.y) + "," + d.x + ")"; });

                    nodeEnter.append("circle")
                        .attr("r", 10)
                        .style("fill", "#fff");

                    nodeEnter.append("text")
                        .attr("x", function(d) {
                            return d.children || d._children ? 0 : -30; })
                        .attr("y", function(d) {
                            return d.children || d._children ? -20 : 0; })
                        .attr("dy", ".35em")
                        .attr("text-anchor", function(d) {
                            return d.children || d._children ? "start" : "end"; })
                        .text(function(d) { return d.label; })
                        .style("fill-opacity", 1);

                    // Declare the links…
                    var link = svg.selectAll("path.link")
                        .data(links, function(d) { return d.target.id; });

                    // Enter the links.
                    link.enter().insert("path", "g")
                        .attr("class", "link")
                        .attr("d", diagonal);

                    // Transition nodes to their new position.
                    var nodeUpdate = node.transition()
                        .select("circle")
                        .attr("r", function(d) { return ($scope.signal == d.name) ? 13 : 10; })
                        .style("fill", function(d) { return ($scope.signal == d.name) ? 'white' : 'white'; })
                        .attr("class", function(d) {
                            return ($scope.signal.indexOf(d.name, $scope.signal.length - d.name.length) !== -1) ? 's' : 'ns'; });

                    link.transition()
                        .duration(800)
                        .attr("class", function(d) {
                            return ($scope.signal.indexOf(d.target.name, $scope.signal.length - d.target.name.length) !== -1)
                                ? 'link s' : 'link ns'; });


                };
                controllerRef.updateBranchTree(root);
            }


            //$scope.pattern = predefinedPatterns.ctrlu;
            //$scope.buildDiagram();
            //$scope.drawDiagram();

        }
    ]);