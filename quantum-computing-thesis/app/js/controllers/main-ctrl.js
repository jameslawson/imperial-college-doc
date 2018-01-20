'use strict';


angular.module('mbqc.controllers.main-ctrl', [])
    .controller('mainCtrl', ['$scope', '$rootScope', '$location', 'evaluation',
        function ($scope, $rootScope, $location, evaluation) {
            $rootScope.isRouteActive = function(viewLocation) {
                return viewLocation === $location.path();
            };
            evaluation.standardFormPerformance();
        }
    ]);