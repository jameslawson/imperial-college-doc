'use strict';


angular.module('mbqc.controllers.assistantCtrl', [])
    .controller('assistantCtrl', ['pattern', 'QubitIO', '$scope', '$rootScope', '$templateCache', 'rewrite', 'latexExport',
        'expressionTree', 'predefinedPatterns', 'compositionTree', 'openGraph',
        function (pattern, QubitIO, $scope, $rootScope, t, rewrite, latexExport,
                  expressionTree, predefinedPatterns, compositionTree, openGraph)
        {

            // build graph
            var adj = {};
            var edges = {};


            t.removeAll();

            $scope.proofPaginateBegin = 0;
            $scope.proofPaginatePerPage = 3;
            $scope.totalPages = 1;
            $scope.proofPaginateMaxSize = 5;
            $scope.currentPage = 1;
            $scope.pages = [];

            $scope.hideBuilder = false;
            $scope.hideProof = true;
            $scope.latexDropDownIsHidden = true;
            $scope.latexExportedCode = "";

            $scope.statisticsisHidden = true;
            $scope.computationTreeisHidden = true;
            $scope.entanglementTreeisHidden = true;

            $scope.undoDisabled = true;
            $scope.standardFormDisabled = true;

            $scope.patterns = [];
            $scope.rewrites = [];
            $scope.numRewrites = 0;
            $scope.rewriteCounts = {EX:0, EZ:0, MX:0, MZ:0, CN:0, CE:0, CX:0, CZ:0};
            $scope.highlights = {0: [], 1: [], 2: []};
            $scope.possibleRules = {};
            $scope.possibleRulesInv = {};
            $scope.patternStatistics = {
                qubitsPreparedImplicitly: [],
                qubitsPreparedExplicitly: [],
                measuredQubits: [],
                nonMeasuredQubits: [],
                numInstructions: 0,
                numPrepare: 0,
                numEntanglements: 0,
                numMeasurements: 0,
                numXCorrections: 0,
                numZCorrections: 0
            };

            var angle = new expressionTree.AdditionNode()
                .left(new expressionTree.AdditionNode().left(new expressionTree.IdentifierNode('α')).right(new expressionTree.IdentifierNode('y')))
                .right(new expressionTree.IdentifierNode('z'));

            function evaluateButtonsDisabled()
            {
                $scope.undoDisabled = ($scope.patterns.length == 1);
                $scope.standardFormDisabled = (Object.keys($scope.possibleRules).length == 0);
            }

            // Highlighting instructions involved in a rewrite when we hover over a rewrite step

            $scope.$on('rewriteStepMouseEnter', function (event, stepNum) {
                var fromHeighlights = $scope.highlights[stepNum] = [];
                var toHeighlights = $scope.highlights[stepNum + 1] = [];
                //
                var u = $scope.rewrites[stepNum].from[0];
                var v = $scope.rewrites[stepNum].from[1];
                for (var i = u; i <= v; i++) {
                    fromHeighlights[i] = 1;
                }
                //
                var w = $scope.rewrites[stepNum].to[0];
                var x = $scope.rewrites[stepNum].to[1];
                for (var j = w; j <= x; j++) {
                    toHeighlights[j] = 1;
                }
                $scope.$digest();
            });
            $scope.$on('rewriteStepMouseLeave', function (event, stepNum) {
                $scope.highlights[stepNum] = [];
                $scope.highlights[stepNum + 1] = [];
                $scope.$digest();
            });
            $scope.$on('rewriteChoiceClick', function (event, index)
            {
                var last = $scope.patterns.length - 1;
                if (last >= 0) {

                    $scope.performRewrite(index);
                    rewrite.evaluatePossibleRules($scope.patterns[last+1],
                        [$scope.possibleRules, $scope.possibleRules]);
                    // Determine whether buttons should be disabled
                    evaluateButtonsDisabled();
                    $scope.$digest();
                }
            });

            $scope.resetAll = function() {
                $scope.proofPaginateBegin = 0;
                $scope.proofPaginatePerPage = 3;
                $scope.totalPages = 1;
                $scope.proofPaginateMaxSize = 5;
                $scope.currentPage = 1;
                $scope.pages = [];
                $scope.hideBuilder = false;
                $scope.hideProof = true;
                $scope.latexDropDownIsHidden = true;
                $scope.latexExportedCode = "";
                $scope.statisticsisHidden = true;
                $scope.computationTreeisHidden = true;
                $scope.entanglementTreeisHidden = true;
                $scope.undoDisabled = true;
                $scope.standardFormDisabled = true;
                $scope.patterns = [];
                $scope.rewrites = [];
                $scope.numRewrites = 0;
                $scope.rewriteCounts = {EX:0, EZ:0, MX:0, MZ:0, CN:0, CE:0, CX:0, CZ:0};
                $scope.highlights = {0: [], 1: [], 2: []};
                $scope.possibleRules = {};
                $scope.possibleRulesInv = {};
                $scope.patternStatistics = {
                    qubitsPreparedImplicitly: [],
                    qubitsPreparedExplicitly: [],
                    measuredQubits: [],
                    nonMeasuredQubits: [],
                    numInstructions: 0,
                    numPrepare: 0,
                    numEntanglements: 0,
                    numMeasurements: 0,
                    numXCorrections: 0,
                    numZCorrections: 0
                };
            };


            $scope.performRewrite = function (index)
            {
                // Find out what was the last pattern and what rewrite rule to use
                var currentStep = $scope.patterns.length - 1;
                var currentPattern = $scope.patterns[currentStep];
                var chosenRule = $scope.possibleRules[index];

                // Add info about rewrite step (what rule, where it was applied)
                $scope.rewrites[currentStep] = {
                    rule: chosenRule,
                    from: chosenRule.lhsInstrsBounds(index),
                    to: chosenRule.rhsInstrsBounds(index)
                };

                // Increase the usage counter for this rule
                $scope.rewriteCounts[chosenRule.name]++;
                $scope.rewriteCounts['total']++;

                // Add the resulting rewritten pattern
                $scope.patterns.push(new pattern.Pattern(chosenRule.rewrittenInstructionsAtIndex(currentPattern, index),
                    {1: QubitIO.In, 2: QubitIO.Out}));

                // Disable highlights for current pattern and for the new pattern
                $scope.highlights[currentStep] = [];
                $scope.highlights[currentStep + 1] = [];

                // Recalculate possible rules for the new pattern
                //$scope.evaluatePossibleRules();
                //$scope.$digest();

            };
            $scope.evaluatePossibleRules = function ()
            {

                $scope.possibleRules = {};
                $scope.possibleRulesInv = {};
                var last = $scope.patterns.length - 1;
                if (last >= 0) {
                    var lastPattern = $scope.patterns[last];
                    rewrite.evaluatePossibleRules(lastPattern, [$scope.possibleRules, $scope.possibleRulesInv])
                }
                console.log($scope.possibleRules);
                //$scope.$digest();
            };
            $scope.undo = function () {
                if (!$scope.undoDisabled)
                {
                    var last = $scope.patterns.length - 1;

                    // if we can perform an undo....
                    if (last >= 1)
                    {
                        // Decrease the usage counter for this rule
                        $scope.rewriteCounts[$scope.rewrites[last-1].rule.name]--;
                        $scope.rewriteCounts['total']--;

                        // Delete the last instruction, delete the last rewrite rule
                        $scope.patterns.pop();
                        delete $scope.highlights[last];
                        $scope.rewrites.pop();
                        $scope.evaluatePossibleRules();

                        // reevaluate whether buttons enabled/disabled
                        evaluateButtonsDisabled();
                    }
                }
            };


            $scope.$on('buildAccepted', function (event, pattern) {
                $scope.hideBuilder = true;
                $scope.hideProof = false;
                $scope.patterns = [pattern];
                $scope.evaluatePossibleRules();
                evaluatePatternStatistics();
                evaluateButtonsDisabled();
                if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
                    $scope.$apply();
                }
            });

            $scope.$on('buildRejected', function (event, pattern) {
                $scope.derrors = pattern.derrors;
            });

            // p28 of Extended Measurement Calculus, Danos et al.
            $scope.standardForm = function ()
            {
                if (!$scope.standardFormDisabled) {
                    var rewrites = [];
                    var rewriteCounts = {};
                    var proof = [];
                    rewrite.findStandardForm($scope.patterns[0], proof, rewrites, rewriteCounts);
                    //console.log('done. Total steps:' + numSteps);
                    $scope.patterns = proof;
                    $scope.rewrites = rewrites;
                    $scope.rewriteCounts = rewriteCounts;
                    $scope.possibleRules = {};
                    $scope.possibleRulesInv = {};
                    evaluateButtonsDisabled();
                }
            };


            $scope.exportToLatex = function () {
                $scope.latexExportedCode = latexExport.exportPatterns($scope.patterns, $scope.rewrites, true);
                $scope.latexDropDownIsHidden = !$scope.latexDropDownIsHidden;
                $('latexExportArea').focus();
            };

            $scope.toggleStatistics = function() {
                $scope.statisticsisHidden = !$scope.statisticsisHidden;
                $scope.computationTreeisHidden = true;
                $scope.entanglementTreeisHidden = true;
            };

            $scope.toggleComputationTree = function() {
                $scope.computationTreeisHidden = !$scope.computationTreeisHidden;
                $scope.statisticsisHidden = true;
                $scope.entanglementTreeisHidden = true;
            };

            $scope.toggleEntanglementTree = function() {
                $scope.entanglementTreeisHidden = !$scope.entanglementTreeisHidden;
                $scope.statisticsisHidden = true;
                $scope.computationTreeisHidden = true;


                var pattern = $scope.patterns[0];
                openGraph.buildGraph(pattern, adj, edges);
                var g = openGraph.prepareGraph(pattern.qubits, adj, edges);
                var layouter = new Graph.Layout.Spring(g);
                layouter.layout();

                //
                $scope.drawTest = function() {
                    var renderer = new Graph.Renderer.Raphael('entanglementGraph', g, 600, 300);
                    renderer.draw();
                }
            };



            // ----------------------------------------------------------------------

            $scope.evaluatePossibleRules();
            evaluateButtonsDisabled();
            $scope.pages = getPages();
            var exportArea = document.getElementById("latexExportArea");
            exportArea.onfocus = function() {
                exportArea.select();
                // Chrome cancels out the selection. This is a workaround to prevent further mouseup intervention
                exportArea.onmouseup = function() {
                    exportArea.onmouseup = null;
                    return false;
                };
            };

            // ----------------------------------------------------------------------


            function evaluatePatternStatistics()
            {
                var qubitsPrepImp, qubitsPrepExp, measuredQubits, nonMeasuredQubits,
                    numPrepare, numEntanglements, numMeasurements,
                    numXCorrections, numZCorrections;
                qubitsPrepImp = []; qubitsPrepExp = []; measuredQubits = []; nonMeasuredQubits = [];
                numPrepare = numEntanglements = numMeasurements = numXCorrections
                   = numZCorrections = 0;

                var pat = $scope.patterns[0];
                for (var q in pat.qubits) {
                    if (pat.qubits.hasOwnProperty(q)) {
                        if (QubitIO.IsInput(pat.qubits[q])) {
                            qubitsPrepImp.push(q);
                        }
                        else {
                            qubitsPrepExp.push(q);
                        }
                        if (QubitIO.IsOutput(pat.qubits[q])) {
                            nonMeasuredQubits.push(q);
                        }
                        else {
                            measuredQubits.push(q);
                        }
                    }
                }

                for (var i = 0, l = pat.instructions.length; i < l; i++)
                {
                    var instr = pat.instructions[i];
                    if (instr instanceof pattern.Prepare) {
                        numPrepare++;
                    }
                    if (instr instanceof pattern.Entanglement) {
                        numEntanglements++;
                    }
                    if (instr instanceof pattern.Measurement) {
                        numMeasurements++;
                    }
                    if (instr instanceof pattern.XCorrection) {
                        numXCorrections++;
                    }
                    if (instr instanceof pattern.ZCorrection) {
                        numZCorrections++;
                    }
                }

                $scope.patternStatistics['qubitsPreparedImplicitly'] = qubitsPrepImp;
                $scope.patternStatistics['qubitsPreparedExplicitly'] = qubitsPrepExp;
                $scope.patternStatistics['measuredQubits'] = measuredQubits;
                $scope.patternStatistics['nonMeasuredQubits'] = nonMeasuredQubits;
                //
                $scope.patternStatistics['numInstructions'] = pat.instructions.length;
                $scope.patternStatistics['numPrepare'] = numPrepare;
                $scope.patternStatistics['numEntanglements'] = numEntanglements;
                $scope.patternStatistics['numMeasurements'] = numMeasurements;
                $scope.patternStatistics['numXCorrections'] = numXCorrections;
                $scope.patternStatistics['numZCorrections'] = numZCorrections;

            }

            // ----------------------------------------------------------------------
            // Pagination

            $scope.selectPage = function(page) {
                if ($scope.currentPage !== page && page > 0 && page <= $scope.totalPages) {
                    $scope.currentPage = page;
                }
            };
            $scope.selectNextPage = function() {
                $scope.selectPage($scope.currentPage+1);
            };
            $scope.selectPrevPage = function() {
                $scope.selectPage($scope.currentPage-1);
            };

            $scope.isCurrentPage = function(page) {
                return $scope.currentPage == page;
            };

            $scope.isCurrentPerPage = function(pp) {
                return $scope.proofPaginatePerPage == pp;
            };

            $scope.isFirstPage = function() {
                return ($scope.currentPage == 1);
            };
            $scope.isLastPage = function() {
                return ($scope.currentPage == $scope.totalPages);
            };
            $scope.setPerPage = function(pp) {
                $scope.proofPaginatePerPage = pp;
            };

            $scope.$watch('patterns.length + proofPaginatePerPage', function() {
                $scope.totalPages = Math.ceil($scope.patterns.length/$scope.proofPaginatePerPage);
            });

            $scope.$watch('totalPages', function(value) {
                $scope.pages = getPages();
                $scope.proofPaginateBegin = ($scope.currentPage-1)*$scope.proofPaginatePerPage;
            });

            $scope.$watch('currentPage', function(value) {
                $scope.pages = getPages();
                $scope.proofPaginateBegin = ($scope.currentPage-1)*$scope.proofPaginatePerPage;
            });

            function getPages()
            {
                if ($scope.currentPage > $scope.totalPages && $scope.totalPages > 0) {
                    $scope.currentPage = $scope.totalPages;
                }
                var pages = [];
                var start = Math.max($scope.currentPage - Math.floor($scope.proofPaginateMaxSize/2), 1);
                var end = start + $scope.proofPaginateMaxSize - 1;
                if (end > $scope.totalPages) {
                    end = $scope.totalPages;
                    start = Math.max(end-$scope.proofPaginateMaxSize+1, 1);
                }
                for (var i = start; i <= end; i++) {
                    pages.push(i);
                }
                return pages;
            }

        }]);



  