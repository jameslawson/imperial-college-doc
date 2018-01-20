'use strict';


angular.module('mbqc.services.pattern-helper', [])
    .factory('patternHelper', ['pattern', function (pattern) {
        function joinSignals(sig1, sig2) {
            var joinWithDuplicates = sig1.concat(sig2);
            var u = {}, a = [];
            for (var i = 0, l = joinWithDuplicates.length; i < l; ++i) {
                if (u.hasOwnProperty(joinWithDuplicates[i])) {
                    continue;
                }
                a.push(joinWithDuplicates[i]);
                u[joinWithDuplicates[i]] = 1;
            }
            return a;
        }

        // Assume qs1, qs2 have no duplicates
        // This function checks that qs1, and qs2 are disjoint
        function disjointQubits(qs1, qs2) {
            var u = {};
            for (var i = 0, l = qs1.length; i < l; ++i) {
                u[qs1[i]] = 1;
            }
            for (var j = 0, k = qs2.length; j < k; ++j) {
                if (u.hasOwnProperty(qs2[j])) {
                    return false;
                }
            }
            return true;
        }

        return {
            joinSignals: joinSignals,
            disjointQubits: disjointQubits
        };
    }]);