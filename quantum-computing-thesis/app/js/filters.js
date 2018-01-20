'use strict';

/* Filters */

angular.module('mbqc.filters', [])
    .filter('interpolate', ['version', function (version) {
        return function (text) {
            return String(text).replace(/\%VERSION\%/mg, version);
        }
    }])
    .filter('sublist', function(){
        return function(input, begin, count){
            return input.slice(begin, begin+count);
        };
    })
    .filter('parseAngle', ['expressionTree', function (expressionTree)
    {
        function flatten (v)
        {
            if (v == null || undefined) return '';
            var ret = '';
            //var greekifyIdMap = {'alpha': ''}

            if (v instanceof expressionTree.AdditionNode) {
                ret += '(' + flatten(v.l) + '+' + flatten(v.r) + ')';
            }
            if (v instanceof expressionTree.SubtractionNode) {
                ret += '(' + flatten(v.l) + '-' + flatten(v.r) + ')';
            }
            if (v instanceof expressionTree.MinusNode) {
                ret += '-(' + flatten(v.l) + ')';
            }
            if (v instanceof expressionTree.DivisionNode) {
                ret += '(' + flatten(v.l) + '/' + flatten(v.r) + ')';
            }
            if (v instanceof expressionTree.MinusOneToPowerNode) {
                ret += '(-1)^(' + flatten(v.l) + ')';
            }
            if (v instanceof expressionTree.IdentifierNode) {
                ret += v.identifier;
            }
            if (v instanceof expressionTree.NumberNode) {
                ret += v.identifier;
            }
            return ret;
        }
        return function (input) {
            return flatten(input);
        }
    }]);
