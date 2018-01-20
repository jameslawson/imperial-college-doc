'use strict';


angular.module('mbqc.services.qubitio', []).
    factory('QubitIO', function ()
    {
        function QubitIO()
        {
            this.Neither = 0;
            this.In = 1;
            this.Out = 2;
            this.InOut = 3;
            this.Unused = 4;
            this.IsInput = function (x) {
                return (x == this.In || x == this.InOut);
            };
            this.IsOutput = function (x) {
                return (x == this.Out || x == this.InOut);
            };
        }

        return new QubitIO();
    });