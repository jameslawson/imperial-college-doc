'use strict';


angular.module('mbqc.services.composition-tree', [])
    .factory('compositionTree', ['pattern', 'QubitIO', 'angleParser',
        function (pattern, QubitIO, angleParser)
    {
        var COMPOSITION_PARAM_TYPES = {
            ANGLE_TYPE: 0,
            QUBIT_NAME_TYPE: 1
        };


        function buildNode(t, evalfn, fn, name, pars, parTypes)
        {
            this.type = t;
            this.evaluate = evalfn;
            this.builderfn = fn;
            this.name = name;
            this.params = pars ? pars : [];
            this.paramTypes = parTypes ? parTypes : [];
            this.l = this.r = null;
            this.parentNode = null;
            this.left = function (n) {this.l = [n]; n.parentNode = this; return this; };
            this.right = function (n) {this.r = [n]; n.parentNode = this; return this; };
            //
            this.cursorleft = false;
            this.cursorright = false;
            // this.cursorParam
            // this.cursorMiddle
            this.inorderMarking = null;
            this.highlight = false;
        }

        function LeafNode(commands) {
            buildNode.call(this,'l',
                function ()
                {
                    return commands;
                });
        }

        function PatternNode(fn, n, pars, parTypes) {
            buildNode.call(this,'p',
                function ()
                {
                    var args = [];
                    for (var i = 0, l = pars.length; i < l; i++) {
                        if (parTypes[i] == COMPOSITION_PARAM_TYPES.ANGLE_TYPE)
                            args.push(angleParser.performParse(pars[i]));
                        if (parTypes[i] == COMPOSITION_PARAM_TYPES.QUBIT_NAME_TYPE)
                            args.push(pars[i]);
                    }
                    //return this.pat;
                    return this.builderfn.apply(undefined, args);
                }, fn, n, pars, parTypes);
        }

        function SequentialNode() {
            buildNode.call(this,'c',
                function ()
                {
                    // check outputs of l = inputs of r
                    // first for loop: x in O1 implies x in I2
                    // second for loop: x in I2 implies x in O1
                    // TODO: do the two for loops
                    for (q in this.l.qubits) {
                        if (this.l.qubits.hasOwnProperty(q)) {
                            if (this.l.qubits[q] == QubitIO.Out && this.r.qubits[q] != QubitIO.Out){
                            }
                        }
                    }


                    // check V1 intersect V2 = O1
                    // first for loop: x in V1 n V2 implies x in O1
                    // second for loop: x in O1 implies x in V1 n V2
                    // TODO: do the two for loops

                    // we have the valid conditions for sequential composition,
                    // so let's go ahead and do it...
                    var newqubits = {};
                    var lpat = this.l[0].evaluate();
                    var rpat = this.r[0].evaluate();

                    // For a qubit in O1 = I2, it has two different io types in P1, P2, say : t1,t2.
                    // We can work out what the io type of this qubit
                    // is in the new pattern as a function of t1, t2. t = f(t1,t2)
                    // maps (io of qubit in O1, io of qubit in I2) -> IO of qubit in new pattern
                    var mergemap = {};
                    mergemap[QubitIO.In] = {}; mergemap[QubitIO.InOut] = {};
                    mergemap[QubitIO.In][QubitIO.Out] = QubitIO.Neither;
                    mergemap[QubitIO.In][QubitIO.InOut] = QubitIO.In;
                    mergemap[QubitIO.InOut][QubitIO.Out] = QubitIO.Out;
                    mergemap[QubitIO.InOut][QubitIO.InOut] = QubitIO.InOut;

                    for (var q in rpat.qubits) {
                        if (rpat.qubits.hasOwnProperty(q)) {
                            var rio = rpat.qubits[q];
                            if (rio == QubitIO.In || rio == QubitIO.Neither) {
                                newqubits[q] = rio;
                            } else {
                                var lio = lpat.qubits[q];
                                newqubits[q] = mergemap[lio][rio];
                            }
                        }
                    }

                    for (var q in lpat.qubits) {
                        if (lpat.qubits.hasOwnProperty(q)) {
                            var lio = lpat.qubits[q];
                            if (lio == QubitIO.Out || lio == QubitIO.Neither) {
                                newqubits[q] = lio;
                            }
                        }
                    }

                    return  new pattern.Pattern(lpat.instructions.concat(rpat.instructions), newqubits);
                });
        }

        function ParallelNode() {
            buildNode.call(this, 't',
                function ()
                {
                    // check V1 intersect V2 = emptyset
                    // first for loop: x in V1 implies x notin V2
                    // second for loop: x in V2 implies x notin V1
                    // TODO: do the two for loops

                    // we have the valid conditions for sequential composition,
                    // so let's go ahead and do it...
                    var newqubits = {};
                    var lpat = this.l[0].evaluate();
                    var rpat = this.r[0].evaluate();

                    // join the two disjoint qubit maps together
                    for (var q in lpat.qubits) {
                        if (lpat.qubits.hasOwnProperty(q)) {
                            newqubits[q] = lpat.qubits[q];
                        }
                    }
                    for (var q in rpat.qubits) {
                        if (rpat.qubits.hasOwnProperty(q)) {
                            newqubits[q] = rpat.qubits[q];
                        }
                    }
                    return new pattern.Pattern(lpat.instructions.concat(rpat.instructions), newqubits);
                });
        }

        function PlaceHolderNode() {
            buildNode.call(this, 'p_h',
                function (){return null;});
        }

        return {
            LeafNode: LeafNode,
            PatternNode: PatternNode,
            SequentialNode: SequentialNode,
            ParallelNode: ParallelNode,
            PlaceHolderNode: PlaceHolderNode,
            COMPOSITION_PARAM_TYPES: COMPOSITION_PARAM_TYPES
        };

    }]);