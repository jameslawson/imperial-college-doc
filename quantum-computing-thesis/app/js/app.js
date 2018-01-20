'use strict';


// Declare app level module which depends on filters, and services
angular.module('mbqc', [
  'ngRoute',
  'ngAnimate',
  'mbqc.filters',
  'mbqc.services.expression-tree',
  'mbqc.services.qubitio',
  'mbqc.services.pattern',
  'mbqc.services.pattern-helper',
  'mbqc.services.angle-parser',
  'mbqc.services.composition-tree',
  'mbqc.services.predefined-patterns',
  'mbqc.services.rewrite',
  'mbqc.services.latex-export',
  'mbqc.services.quantum-math',
  'mbqc.services.simulation',
  'mbqc.services.simulation-logger',
  'mbqc.services.open-graph',
  'mbqc.services.predefined-open-graphs',
  'mbqc.services.flow-analyser',
  'mbqc.services.evaluation',
  'mbqc.services',
  'mbqc.directives',
  'mbqc.controllers.main-ctrl',
  'mbqc.controllers.builderCtrl',
  'mbqc.controllers.assistantCtrl',
  'mbqc.controllers.simulatorCtrl',
  'mbqc.controllers.flowCtrl',
  'mbqc.controllers'
])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/assistant', {templateUrl: 'partials/assistant.html', controller: 'assistantCtrl'});
  $routeProvider.when('/simulator', {templateUrl: 'partials/simulator.html', controller: 'SimulatorCtrl'});
  $routeProvider.when('/flow', {templateUrl: 'partials/flow.html', controller: 'FlowCtrl'});
  $routeProvider.otherwise({redirectTo: '/simulator'});

}])
.run(['$templateCache', function($templateCache) {
    $templateCache.removeAll();
}]);