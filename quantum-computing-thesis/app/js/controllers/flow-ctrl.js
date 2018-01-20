'use strict';


angular.module('mbqc.controllers.flowCtrl', [])
    .controller('FlowCtrl', ['$scope', '$rootScope', 'pattern', 'QubitIO', 'flowAnalyser', 'predefinedOpenGraphs', 'openGraph',
        function ($scope, $rootScope, pattern, qio, fa, pogs, openGraph)
        {

            var controllerRef = this;


            var freshNames = ['a','b','c','d','e','f','g'];
            var freshNum = 0;

            var modes = {normal:0, addEdge: 5, deleteNode : 6};
            $scope.currentMode = modes['deleteNode'];
            var addEdgeFrom = null;

            $scope.setMode = function(m) {
                $scope.currentMode = modes[m] ? modes[m] : modes['normal'];
            };
            $scope.isCurrentMode = function(m) {
                return $scope.currentMode == modes[m];
            };

            this.redraw = function() {
                $scope.flowLoaded = true;
//                console.log(flowResult1[0]);
//                console.log(flowResult1[1]);
//                console.log(flowResult1[2]);
//                //
//                console.log(flowResult2[0]);
//                console.log(flowResult2[1]);
//                console.log(flowResult2[2]);

                //
                if (this.renderer == null) {
                    this.renderer = new Graph.Renderer.Raphael('canvas', this.graph, 600, 300);
                }
                /*var layerColors = ['red','green','purple','orange','blue','violet','brown'];
                for(var n in this.graph.nodes) {
                    this.layouter.graph.nodes[n].render = openGraph.buildRender(this.buildQubits[n],layerColors[flowResult2[2][n]],this.buildNodeClick(n));
                }*/

                /* colourising the shortest paths and setting labels */
                /*for(var e in this.graph.edges) {
                    this.graph.edges[e].style = { label : '>' };
                }*/

                this.renderer.draw();
            };


            $scope.redraw = function() {
                controllerRef.redraw();
            };

            this.buildNodeClick = function(n) {
                return function(raphaelnode) {
                    controllerRef.handleNodeClick(n,raphaelnode);
                    //console.log('hello ' + n);
                }
            };

            this.onNodeClick = function() {
                //console.log('hello ');
            };

            this.handleNodeClick = function(n,raphaelnode) {
                if ($scope.isCurrentMode('addEdge')) {
                    if (addEdgeFrom == null) {
                        addEdgeFrom = n;
                    } else {
                        if (addEdgeFrom != n) {
                            this.addEdge(addEdgeFrom,n);
                        }
                        addEdgeFrom = null;
                    }
                } else if ($scope.isCurrentMode('deleteNode')) {
                    this.deleteNode(n, raphaelnode);
                }
            };

            $scope.autolayout = function() {
                controllerRef.layouter.layout();
                controllerRef.renderer.draw();
            };

            $scope.analyseFlow = function() {
                var flowResult = fa.flow(controllerRef.buildQubits, controllerRef.buildAdj);
                var gflowResult = fa.gflow(controllerRef.buildQubits, controllerRef.buildAdj);
                console.log(flowResult[0]);
                console.log(flowResult[1]);
                console.log(flowResult[2]);
                $scope.foundCausalFlow = flowResult[0];
                $scope.causalSuccessorFunc = flowResult[1];
                $scope.causalPartialOrder = flowResult[2];
                //console.log(gflowResult);
                $scope.showAnalysisResults = true;
            };



            $scope.addNeitherNode = function() {controllerRef.addNeitherNode()};
            this.addNeitherNode = function() {this.addNode(qio.Neither);};

            $scope.addOutNode = function() {controllerRef.addOutNode();};
            this.addOutNode = function() {this.addNode(qio.Out);};

            $scope.addInNode = function() {controllerRef.addInNode();};
            this.addInNode = function() {this.addNode(qio.In);};

            $scope.addInOutNode = function() {controllerRef.addInOutNode();};
            this.addInOutNode = function() {this.addNode(qio.InOut);};

            this.addNode = function(io) {
                var qname = freshName();
                openGraph.addNode(this.graph,qname,io,this.buildNodeClick);
                this.buildQubits[qname] = io;
                this.buildAdj[qname] = [];
                $scope.setMode('normal');
                this.layouter.layout();
                this.renderer.draw();
            };

            this.addEdge = function(from,to) {
                this.graph.addEdge(from,to);
                this.buildAdj[from].push(to);
                this.buildAdj[to].push(from);
                //this.layouter.layout();
                this.renderer.draw();
            };

            this.deleteNode = function(n, raphaelnode)
            {
                /*for (var k = 0; k < this.buildAdj[n].length; k++) {
                    var neighbour = this.buildAdj[n][k];
                    this.buildAdj[neighbour].splice(this.buildAdj[neighbour].indexOf(n), 1);
                }
                delete this.buildAdj[n];
                delete this.buildQubits[n];*/

                raphaelnode.shape.remove();

                for (var i = 0; i < this.graph.edges.length; i++) {
                    if (this.graph.edges[i] != undefined &&
                        this.graph.edges[i].source.id == n || this.graph.edges[i].target.id == n) {
                        if (this.graph.edges[i].connection != undefined) {
                            if (this.graph.edges[i].connection.fg) this.graph.edges[i].connection.fg.remove();
                            if (this.graph.edges[i].connection.label) this.graph.edges[i].connection.label.remove();
                            delete this.graph.edges[i].connection;
                        }
                        this.graph.edges.splice(i, 1);
                        i--;
                    }
                }

                for (i = 0; i < this.graph.nodelist.length; i++) {
                    if (this.graph.nodelist[i].id == n) {
                        this.graph.nodelist.splice(i, 1); break;
                    }
                }
                for (i = 0; i < this.graph.nodes.length; i++) {
                    if (this.graph.nodes[i] != undefined) {
                        if (this.graph.nodes[i].id == n) {
                            this.graph.nodes.splice(i, 1);
                        } else {
                            for (var j = 0; j < this.graph.nodes[i].edges.length; j++) {
                                if (this.graph.nodes[i].edges[j] != undefined &&
                                    this.graph.nodes[i].edges[j].source.id == n ||
                                    this.graph.nodes[i].edges[j].target.id == n)
                                {
                                    this.graph.nodes[i].edges.splice(j, 1); j--;
                                }
                            }
                        }
                    }
                }
                //console.log(this.renderer.r.set.items);
                //var set = this.renderer.r.set();

                this.layouter.layout();
                this.renderer.draw();

            };

            function freshName() {
                return freshNames[freshNum++];
            }


            this.buildAdj = {};
            this.buildQubits = {};
            this.renderer = null;
            this.graph = openGraph.prepareGraph(this.buildQubits, this.buildAdj, this.buildNodeClick);
            this.layouter = new Graph.Layout.Spring(this.graph);
            this.layouter.layout();
            $scope.flowLoaded = false;
            $scope.foundCausalFlow = false;
            $scope.causalSuccessorFunc = null;
            $scope.causalPartialOrder = null;
            $scope.showAnalysisResults = false;
        }

    ]);
