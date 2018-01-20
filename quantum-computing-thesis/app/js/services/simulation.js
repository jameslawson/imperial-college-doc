'use strict';


angular.module('mbqc.services.simulation', []).
    factory('simulation', ['quantumMath', 'expressionTree', 'QubitIO', 'pattern', function (qm, et, qio, pattern)
    {
        var MEASURE_RAND_RANGE = 1;
        var f = qm.complexFactory;

        function Simulation()
        {
            this.reset = function() {
                // the input pattern we wish to execute
                this.pattern = null;

                // the quantum state of the simulation
                this.state = [f.one()];

                // maps qubit names --> indices of the state array
                // indexToName is the inverse map
                this.nameToIndex = {};
                this.indexToName = [];

                // index to pattern.instructions for the instruction to be run next
                this.currentInstrIndex = 0;

                // how many qubits in our system
                this.numActiveQubits = 0;

                // have we started simulation
                // we cannot execute commands until this is true
                this.hasBegun = false;

                // aka gamma. Stores the outcomes of qubit measurements
                // maps: qubit name ->> {0, 1}
                this.outcomeMap = {};
                this.signal = "";

                // maps angle identifiers (greek letters) to numbers (angle in radians)
                this.angleContext = {'x':0, 'π':Math.PI};
            };
            this.reset();

            // begin the simulation
            // inputstate: maps input qubit name ->> qubit
            this.begin = function(pattern, angleContext, inputstates, logger)
            {
                this.reset();
                this.hasBegun = true;
                this.currentInstrIndex = pattern.instructions.length-1;
                this.pattern = pattern;
                this.logger = logger;
                this.logger && this.logger.begin && this.logger.begin(this.numActiveQubits);

                // add values for symbolic angles to this.angleContext
                for (var ang in angleContext) {
                    if (angleContext.hasOwnProperty(ang)) {
                        this.angleContext[ang] = angleContext[ang];
                    }
                }

                // add input qubits to state
                for (var q in inputstates) {
                    if (inputstates.hasOwnProperty(q)) {
                        this.state = qm.vectorTensor(this.state, [inputstates[q][0].clone(),inputstates[q][1].clone()] );
                        this.nameToIndex[q] = this.numActiveQubits++;
                        this.indexToName.push(q);
                        this.logger && this.logger.prepareInput &&
                            this.logger.prepareInput(this.currentInstrIndex,q,this.nameToIndex[q]);
                    }
                }


                /*for (var x in pattern.qubits) {
                    if (pattern.qubits.hasOwnProperty(x)) {
                        if (qio.IsInput(pattern.qubits[x])) {
                            this.nameToIndex[x] = this.numActiveQubits++;
                        }
                    }
                }*/

                // set all non-input qubits to |+> state
                for (var x in pattern.qubits) {
                    if (pattern.qubits.hasOwnProperty(x)) {
                        if (!qio.IsInput(pattern.qubits[x])) {
                            this.prepare(x);
                        }
                    }
                }
            };

            this.next = function() {
                if (this.currentInstrIndex < 0) return;
                var instr = this.pattern.instructions[this.currentInstrIndex];
                if (instr instanceof pattern.Prepare) {
                    //this.prepare(instr.qubits[0]);
                }
                if (instr instanceof pattern.Entanglement) {
                    this.entangle(instr.qubits[0], instr.qubits[1]);
                }
                if (instr instanceof pattern.Measurement) {
                    this.measure(instr.qubits[0], instr.angle, instr.signals[0], instr.signals[1]);
                }
                if (instr instanceof pattern.XCorrection) {
                    this.xcorrect(instr.qubits[0], instr.signals[0]);
                }
                if (instr instanceof pattern.ZCorrection) {
                    this.zcorrect(instr.qubits[0], instr.signals[0]);
                }
                if (this.currentInstrIndex == 0) {
                    // then we have just executed the last command in the pattern ...
                    this.logger && this.logger.end && this.logger.end();
                }
                this.currentInstrIndex--;
            };

            this.runAll = function() {
                while (this.currentInstrIndex >= 0) {
                    this.next();
                }
            };


            this.prepare = function(i)
            {
                this.nameToIndex[i] = this.numActiveQubits++;
                this.indexToName.push(i);
                var plus = [f.one(),f.one()];
                qm.scaleVector(1/Math.sqrt(2), plus);
                this.state = qm.vectorTensor(this.state,plus);

                // Log the result
                this.logger && this.logger.prepare &&
                    this.logger.prepare(this.currentInstrIndex, i, this.nameToIndex[i]);
            };

            this.entangle = function(i,j)
            {
                // outerzero = |0><0|, outerone = |1><1|, z = swap matrix
                var outerzero = [[f.one(),f.zero()],[f.zero(),f.zero()]],
                    outerone = [[f.zero(),f.zero()],[f.zero(),f.one()]];
                var z = [[f.one(),f.zero()],[f.zero(),f.minusone()]];

                // PERFORM THE ENTANGLEMENT
                // ------------------------
                // CZ_ij = |0><0|_i tensor I_j + |1><1|_j tensor Z_j
                var cz = this.combinedStateMatrix(outerzero, this.nameToIndex[i]);
                qm.matrixAddWith(cz, this.combinedStateMatrices(outerone, this.nameToIndex[i], z, this.nameToIndex[j]));
                this.state = qm.matrixVectorMultiply(cz, this.state);

                // Log the result
                this.logger && this.logger.entangle &&
                    this.logger.entangle(this.currentInstrIndex, i, j, this.nameToIndex[i], this.nameToIndex[j]);
            };

            this.measure = function(i, angle, signal1, signal2)
            {
                // FIND THE ANGLE
                // --------------
                // find: sgamma and tgamma, the signals evaluated with outcomeMap
                // go through each signal and perform modulo 2 of outcomes to find respective final values
                var sgamma = 0;
                var tgamma = 0;
                for (var u = 0, l = signal1.length; u < l; u++) {
                    sgamma = qm.mod2Add(sgamma, this.outcomeMap[u]);
                }
                for (var v = 0, k = signal2.length; v < k; v++) {
                    tgamma = qm.mod2Add(tgamma, this.outcomeMap[v]);
                }

                // find: fullangle:Number (aka alpha_gamma), the actual angle used for measurement
                var fullangle = new et.AdditionNode()
                .left(
                    new et.MultiplicationNode()
                        .left(new et.MinusOneToPowerNode().left(new et.NumberNode(sgamma)))
                        .right(angle)
                ).right(
                    new et.MultiplicationNode()
                       .left(new et.NumberNode(tgamma))
                       .right(new et.IdentifierNode('π'))
                ).evaluate(this.angleContext);


                // PERFORM THE MEASUREMENT
                // -----------------------
                var m1 = qm.plusMeasureMatrix(fullangle);
                var m2 = qm.minusMeasureMatrix(fullangle);

                // The collapsed quantum state as a result of measuring 1
                // Probability(j) = (combinedStateMatrix(mj)|psi>).lengthsquared
                var projection = qm.matrixVectorMultiply(this.combinedStateMatrix(m1, this.nameToIndex[i]), this.state);
                var p1 = qm.vectorLengthSquared(projection); // TODO: does this need abs?

                // Pr[R < p1] = p1.
                // we collapse the state to the projection/sqrt(prob)
                var R = Math.random() * MEASURE_RAND_RANGE;
                if (R < p1 * MEASURE_RAND_RANGE) {
                    // Outcome of measurement is 0:
                    this.outcomeMap[i] = 0;
                    this.signal = "0"+this.signal;
                    this.state = qm.scaleVector(1/Math.sqrt(p1), projection);
                } else {
                    // Outcome of measurement is 1:
                    this.outcomeMap[i] = 1;
                    this.signal = "1"+this.signal;
                    var p2 = 1 - p1;
                    this.state = qm.matrixVectorMultiply(qm.scaleMatrix(1/Math.sqrt(p2), this.combinedStateMatrix(m2, this.nameToIndex[i])),this.state)
                }

                // Log the result
                this.logger && this.logger.measure &&
                    this.logger.measure(this.currentInstrIndex, i, this.nameToIndex[i], fullangle, sgamma, tgamma, this.outcomeMap[i]);
            };

            this.combinedStateMatrix = function(m, index)
            {
                if (this.numActiveQubits == 0 || index < 0 || index > this.numActiveQubits) return;

                var identity;
                var r = [[f.one()]];
                //
                for (var j = 0; j < index; j++) {
                    identity = [[f.one(),f.zero()],[f.zero(),f.one()]];
                    r = qm.matrixTensor(identity, r);
                    // TODO: make a qmmath function that does identity-tensors...without creating so many intermediate new objects!
                }
                //
                r = qm.matrixTensor(r, m);
                //
                for (j = index+1; j < this.numActiveQubits; j++) {
                    identity = [[f.one(),f.zero()],[f.zero(),f.one()]];
                    r = qm.matrixTensor(r, identity);
                }
                return r;
            };


            // TODO: generalise this to N matrix-index pairs
            this.combinedStateMatrices = function(m1, index1, m2, index2)
            {
                var identity, nextMatrix;
                var r = [[f.one()]];
                for (var j = 0; j < this.numActiveQubits; j++) {
                    if (j == index1) {
                        nextMatrix = m1;
                    }
                    else if (j == index2) {
                        nextMatrix = m2;
                    }
                    else {
                        nextMatrix = [[f.one(),f.zero()],[f.zero(),f.one()]];
                    }
                    r = qm.matrixTensor(r, nextMatrix);
                }
                return r;
            };

            // go through the signal and perform modulo 2 of outcomes to find final value
            // if 0, we do nothing. if 1, then we perform the correction
            this.xcorrect = function(i, signal)
            {
                // Evaluate signal
                // ---------------
                var mod2sum = 0;
                for (var u = 0, l = signal.length; u < l; u++) {
                    mod2sum = qm.mod2Add(mod2sum, this.outcomeMap[u]);
                }
                if (mod2sum == 1)
                {
                    // Perform correction
                    // ------------------
                    var x = [[f.zero(),f.one()],[f.one(),f.zero()]];
                    qm.matrixVectorMultiply(this.combinedStateMatrix(x, this.nameToIndex[i]), this.state);
                }

                // Log the result
                this.logger && this.logger.xcorrect &&
                    this.logger.xcorrect(this.currentInstrIndex, i, this.nameToIndex[i], mod2sum);
            };

            this.zcorrect = function(i, signal)
            {
                // Evaluate signal
                // ---------------
                var mod2sum = 0;
                for (var u = 0, l = signal.length; u < l; u++) {
                    mod2sum = qm.mod2Add(mod2sum, this.outcomeMap[u]);
                }
                if (mod2sum == 1)
                {
                    // Perform correction
                    // ------------------
                    var z = [[f.one(),f.zero()],[f.zero(), f.minusone()]];
                    qm.matrixVectorMultiply(this.combinedStateMatrix(z, this.nameToIndex[i]), this.state);
                }

                // Log the result
                this.logger && this.logger.zcorrect &&
                    this.logger.zcorrect(this.currentInstrIndex, i, this.nameToIndex[i], mod2sum);
            };

            this.factoriseInputQubits = function()
            {

            }
        }

        return new Simulation()
    }]);