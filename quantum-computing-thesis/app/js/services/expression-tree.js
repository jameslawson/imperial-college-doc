'use strict';


angular.module('mbqc.services.expression-tree', [])
    .factory('expressionTree', function ()
    {
        function buildNode(isunary, evalfn, id)
        {
            this.isUnaryNotBinary = isunary;
            this.evaluate = evalfn;
            this.identifier = id;
            this.l = this.r = null;
            this.left = function (n) {this.l = n; return this; };
            this.right = function (n) {this.r = n; return this; };
        }

        function NumberNode(n) {
            buildNode.call(this,true,
                function (context) {
                    return n;
                }, n);
        }

        function IdentifierNode(id) {
            buildNode.call(this,true,
                function (context) {
                    context['x'] = 0;
                    context['π'] = Math.PI;
                    return context[this.identifier];
                }, id);
        }

        function AdditionNode() {
            buildNode.call(this,false,
                function (context) {
                    return this.l.evaluate(context) + this.r.evaluate(context);
                });
        }

        function SubtractionNode() {
            buildNode.call(this,false,
                function (context) {
                    return this.l.evaluate(context) - this.r.evaluate(context);
                });
        }

        function MinusNode() {
            buildNode.call(this,true,
                function (context) {
                    return -1 * this.l.evaluate(context);
                });
        }

        function MultiplicationNode() {
            buildNode.call(this, false,
                function (context) {
                    return this.l.evaluate(context) * this.r.evaluate(context);
                });
        }

        function DivisionNode() {
            buildNode.call(this, false,
                function (context) {
                    return this.l.evaluate(context) / this.r.evaluate(context);
                });
        }

        function MinusOneToPowerNode() {
            buildNode.call(this,true,
                function (context) {
                    return Math.pow(-1, this.l.evaluate(context));
                });
        }


        return {
            IdentifierNode: IdentifierNode,
            NumberNode: NumberNode,
            AdditionNode: AdditionNode,
            SubtractionNode: SubtractionNode,
            MinusNode: MinusNode,
            MultiplicationNode: MultiplicationNode,
            DivisionNode: DivisionNode,
            MinusOneToPowerNode: MinusOneToPowerNode
        };

    });