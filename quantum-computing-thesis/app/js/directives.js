'use strict';

/* Directives */


angular.module('mbqc.directives', [])
    .directive('appVersion', ['version', function (version) {
        return function (scope, elm, attrs) {
            elm.text(version);
        };
    }])
    .directive('builder', function() {
        return {
            restrict: "E",
            scope: {purposeHeader:'@', hide:'='},
            templateUrl: 'templates/builder.html'
        }
    })
    .directive('builderQubits', function() {
        return {
            templateUrl: 'templates/builder-qubits.html'
        }
    })
    .directive('qubitStateInput', function() {
        return {
            scope: {qubit:'='},
            templateUrl: 'templates/qubit-state-input.html'
        }
    })
    .directive('proof', ['$compile', function($compile) {
        return {
            scope: {patterns: '=', rewrites:'=', highlights: '=', possibleRules:'=',
                paginateBegin:'=', paginateCount:'='},
            templateUrl: 'templates/proof.html'
        }
    }])
    .directive('nextRewrite', function() {
        return {
            scope: {possibleRules: '='},
            templateUrl: 'next-rewrite.html'
        }
    })
    .directive('rewriteStep', function() {
        return {
            //transclude: true,
            scope: {ruleName: '=', stepNum: '='},
            link: function(scope, element, proofCtrl) {
                element.bind("mouseenter", function() {
                    scope.$emit('rewriteStepMouseEnter',scope.stepNum);
                });
                element.bind("mouseleave", function() {
                    scope.$emit('rewriteStepMouseLeave',scope.stepNum);
                });
            },
            templateUrl: 'templates/rewrite-step.html'
        }
    })
    .directive('rwchoice', ['pattern', '$compile', function(pattern, $compile) {
        return {
            restrict: "E",
            scope: {index: '=', ruleName: '='},
            link: function(scope, element, proofCtrl) {
                element.bind("mousedown", function() {
                    scope.$emit('rewriteChoiceClick', scope.index);
                });
            },
            templateUrl: 'templates/rewrite-choice-bubble.html'
        }
    }])
    .directive('instructions', ['pattern', '$compile', function(pattern, $compile) {
        return {
            restrict: "A",
            scope: {instrs: '=', highlights: '=', possibleRules: '=', buildSubStep:'=', buildCursorIndex:'='},
            templateUrl: 'templates/instructions.html'
        };
    }])
    .directive('measurement', function () {
        return {
            //restrict: "E",s
            scope: {index: '=', instr: '=', possibleRule: '=', buildSubStep:'=', buildCursorIndex:'='},
            templateUrl: 'templates/measurement-instr.html'
        }
    })
    .directive('correction', function () {
        return {
            //restrict: "E",
            scope: {index: '=', instr: '=', possibleRule: '=', buildSubStep:'=', buildCursorIndex:'='},
            templateUrl: 'templates/correction-instr.html'
        }
    })
    .directive('preparation', function () {
        return {
            //restrict: "E",
            scope: {index: '=', instr: '=', possibleRule: '=', buildSubStep:'=', buildCursorIndex:'='},
            templateUrl: 'templates/preparation-instr.html'
        }
    })
    .directive('entanglement', function () {
        return {
            //restrict: "E",
            scope: {index: '=', instr: '=', possibleRule: '=', buildSubStep:'=', buildCursorIndex:'='},
            templateUrl: 'templates/entanglement-instr.html'
        }
    })
    .directive('signal', function () {
        return {
            restrict: "A",
            scope: {outcomes: '='},
            templateUrl: 'templates/signal.html'
        }
    })
    .directive('composition', function () {
        return {
            restrict: "E",
            scope: {outcomes: '='},
            templateUrl: 'templates/signal.html'
        }
    })
    .directive('sfTreepeat', function() {
        return {
            restrict: 'A',
            scope: true,
            controller: function ($scope, $attrs)
            {
                function parseRepeatExpression(expression) {
                    var match = expression.match(/^\s*([\$\w]+)\s+of\s+([\S\s]*)$/);
                    if (!match) throw new Error("...");
                    return {
                        nodeIdentifier: match[1],
                        rootIdentifier: match[2]
                    };
                }
                var identifiers = this.identifiers = parseRepeatExpression($attrs.sfTreepeat);
                $scope.$watch(this.ident.root, function(v) {
                    $scope[ident.value] = v;
                });
            },
            compile: function (element)
            {
                var template = element.html();
                return {
                    pre: function (scope, element, attrs, controller) {
                        controller.template = template;
                    }
                };
            }
        };
    })
    .directive('sfTreecurse', function($compile){
        return {
            require: "^sfTreepeat",
            link: function (scope, startel, attrs, controller) {
                var build = ['<ul><li sf-treepeat="node of treeData.left">', '<li>p</li>', ''];
                var el = angular.element(build.join(''));
                iterStartElement.replaceWith(el);
                $compile(el)(scope);
            }
        };
    });
