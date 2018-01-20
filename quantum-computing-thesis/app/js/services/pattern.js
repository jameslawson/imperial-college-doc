angular.module('mbqc.services.pattern', []).
    factory('pattern', ['QubitIO', function (QubitIO) {

        function Pattern(instrs, qubits) {
            this.instructions = instrs;
            this.qubits = qubits;
            this.derrors = {};

            //------------------------------------------------------
            // The number of instructions of type x
            // @param: x - x \in {Entanglement,Measurement,Prepare,...}
            this.numberOfType = function (x) {
                var count = 0;
                for (var i = this.instructions.length - 1; i >= 0; i--) {
                    if (this.instructions[i] instanceof x) {
                        count++;
                    }
                }
                return count;
            };

            // convert a ltr index to a rtl index
            this.rtlIdx = function(index) {
                return this.instructions.length - index - 1;
            };

            //------------------------------------------------------

            // Basic sanity checks
            this.isWellFormed = function () {
                // TODO
                return true;
            };

            //------------------------------------------------------
            // p8 of Extended Measurement Calculus, Danos et al.
            this.isValidPattern = function () {
                return (this.isWellFormed() && this.isValidD0() && this.isValidD1()
                    && this.isValidD2() && this.isValidD3());
            };

            // Signals rule
            // pre: formula is well formed
            this.isValidD0 = function () {
                // Initially, no qubits have been measured.
                // Maintain the map, measured: int -> bool
                var measured = {'zero': true, 'one': true};
                for (var q in this.qubits) {
                    measured[q] = false;
                }
                // Go right to left through instructions.
                // When we find an instr whose signal has outcomes from
                // measurements not yet performed, return false
                for (var i = this.instructions.length - 1; i >= 0; i--) {
                    var instr = this.instructions[i];
                    for (var j = instr.signals.length - 1; j >= 0; j--) {
                        var signal = instr.signals[j];
                        for (var k = signal.length - 1; k >= 0; k--) {
                            if (!measured[signal[k]]) {
                                this.addError(0, ['The command at index: ', this.rtlIdx(i),
                                    ' has an anachronistic outcome for the measurement of: ', signal[k]].join(''));
                                return false;
                            }
                        }
                    }
                    if (instr instanceof Measurement) {
                        measured[instr.qubits[0]] = true;
                    }
                }
                return true;
            };

            // D1: E,N,M Instructions can't operate on already-measured qubits
            // pre: formula is well formed
            this.isValidD1 = function () {
                // Initially, no qubits have been measured.
                // Maintain the map, measured: int -> bool
                var measured = {};
                for (var q in this.qubits) {
                    measured[q] = false;
                }
                // Go right to left through instructions.
                // When we find an instr (that isn't a C) and it
                // operates on an already measured qubit, return false
                for (var i = this.instructions.length - 1; i >= 0; i--) {
                    var instr = this.instructions[i];
                    if (!(instr instanceof Correction)) {
                        for (var j = instr.qubits.length - 1; j >= 0; j--) {
                            var q = instr.qubits[j];
                            if (measured[q]) {
                                this.addError(1, ['The command at index: ', this.rtlIdx(i),
                                    ' operates on an already measured qubit: ', q].join(''));
                                return false;
                            }
                        }
                    }
                    if (instr instanceof Measurement) {
                        measured[instr.qubits[0]] = true;
                    }
                }
                return true;
            };

            // D2: We can't operate on unprepared qubits (unless it is input)
            // pre: formula is well formed
            this.isValidD2 = function () {
                // Initially, no qubits, except inputs, have been prepped.
                // Maintain the map, prep: int -> bool
                var prepped = {}
                for (var q in this.qubits) {
                    prepped[q] = (QubitIO.IsInput(this.qubits[q]));
                }
                // Go right to left through instructions.
                // When we find N[i] instr, update prep so i mapsto true
                // Otherwise we found an E,M,C instr. Check to see if
                // they use any unprepared qubits. If so, return false.
                for (var i = this.instructions.length - 1; i >= 0; i--) {
                    var instr = this.instructions[i];
                    if (instr instanceof Prepare) {
                        prepped[instr.qubits[0]] = true;
                    } else {
                        for (var j = instr.qubits.length - 1; j >= 0; j--) {
                            if (!prepped[instr.qubits[j]]) {
                                this.addError(2, ['The command at index: ', this.rtlIdx(i),
                                    ' operates on unprepared qubit, ', instr.qubits[0]].join(''));
                                return false;
                            }
                        }
                    }
                }
                return true;
            };

            // D3: For all qubits, q: q is measured iff (q is input or q is intermediate)
            // pre: formula is well formed
            this.isValidD3 = function () {
                // (-->) q is measured --> (q is input or q is intermediate)
                //   iff q is measured --> not output
                // go thru all M's, if we find one tht measures output qubit, ret false
                for (var i = this.instructions.length - 1; i >= 0; i--) {
                    var instr = this.instructions[i];
                    if (instr instanceof Measurement) {
                        var measuredQubit = instr.qubits[0];
                        if (QubitIO.IsOutput(this.qubits[measuredQubit])) {
                            this.addError(3, ['The command at index: ', this.rtlIdx(i),
                                'measured output qubit: ', instr.qubits[0]].join(''));
                            return false;
                        }
                    }
                }
                // (<--)  q is input or q is intermediate -> q is measured
                for (var q in this.qubits) {
                    // check input and intermediate qubits
                    // loop through instructions to find one that measures q
                    var qio = this.qubits[q];
                    if (!QubitIO.IsOutput(this.qubits[q])) {
                        for (var i = this.instructions.length - 1; i >= 0; i--) {
                            var instr = this.instructions[i];
                            // we found a measurement instr that measures q
                            // so move onto the next qubit
                            if (instr instanceof Measurement && instr.qubits[0] == q) {
                                break;
                            }
                        }
                        // if i < 0, then no instruction measures q - D3 fails!
                        if (i < 0) {
                            this.addError(3, ['The qubit: ', q, ' has not been measured'].join(''));
                            return false;
                        }
                    }
                }
                return true;
            };


            this.addError = function(num, desc) {
                this.derrors[num] = desc;
            };

            this.standardForm = function () {
                // TODO
            }
        }

        function Instruction(qubits, signals) {
            this.qubits = [];
            this.signals = [];
            this.letter = '';
        }

        function Entanglement(q1, q2) {
            //Instruction.call(q, []);
            this.qubits = [q1, q2];
            this.signals = [];
            this.letter = 'E';
        }

        function Prepare(q) {
            //Instruction.call(q, []);
            this.qubits = [q];
            this.signals = [];
            this.letter = 'N';
        }

        function Measurement(q, angle, sig1, sig2) {
            //Instruction.call(q, sig);
            this.qubits = [q];
            this.signals = [sig1, sig2];
            this.angle = angle;
            this.letter = 'M';
        }

        function Correction(q, sig) {
            //Instruction.call(q, sig);
            this.qubits = [q];
            this.signals = [sig];
            this.letter = 'C';
        }

        function XCorrection(q, sig) {
            Correction.call(this, q, sig);
            this.letter = 'X';
        }

        function ZCorrection(q, sig) {
            Correction.call(this, q, sig);
            this.letter = 'Z';
        }

        Entanglement.prototype = new Instruction([], [], []);
        Measurement.prototype = new Instruction([], [], []);
        Correction.prototype = new Instruction([], [], []);
        Prepare.prototype = new Instruction([], []);
        ZCorrection.prototype = new Correction([], []);
        XCorrection.prototype = new Correction([], []);

        return {
            Pattern: Pattern,
            Instruction: Instruction,
            Entanglement: Entanglement,
            Prepare: Prepare,
            Measurement: Measurement,
            Correction: Correction,
            XCorrection: XCorrection,
            ZCorrection: ZCorrection,
            SIGNAL_ZERO: 'zero',
            SIGNAL_ONE: 'one'
        };
    }]);