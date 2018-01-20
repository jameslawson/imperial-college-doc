'use strict';

/* jasmine specs for controllers go here */

describe('main controller', function ()
{
    var ctrl, scope, service;

    beforeEach(module('mbqc.controllers.main-ctrl'));
    beforeEach(
            inject(function($controller, $rootScope) {
                scope = $rootScope.$new();
                ctrl = $controller('mainCtrl',{$scope: scope});
            })
    );
    it('should be defined', inject(function ($controller) {
        expect(ctrl).toBeDefined();
    }));
});


/*
describe('builder controller', function ()
{
    var ctrl, scope, service;

    beforeEach(module('mbqc.controllers.builderCtrl'));
    beforeEach(
        inject(function($controller, $rootScope, $pattern) {
            scope = $rootScope.$new();
            var pattern = $pattern.$new();
            ctrl = $controller('builderCtrl',{$scope: scope, $pattern: pattern});
        })
    );
    it('should be defined', inject(function ($controller) {
        //expect(ctrl).toBeDefined();
    }));
});
*/
