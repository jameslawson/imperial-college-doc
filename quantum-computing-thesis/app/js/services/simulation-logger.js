'use strict';


angular.module('mbqc.services.simulation-logger', []).
    factory('simulationLogger', ['quantumMath', 'expressionTree', 'QubitIO', 'pattern', function (qm, et, qio, pattern)
    {
        function SimulationLogger()
        {
            this.reset = function() {
                this.commentary = [];
                this.noActiveQubits = 0;
                this.noDestroyedQubits = 0;
                this.noQubitsDueDestroy = 0;
                this.noQubitsDueOutput = 0;
                this.noCommandsExecuted = 0;
                this.noEntangementExecuted = 0;
                this.noPrepareExecuted = 0;
                this.noMeasurementExecuted = 0;
                this.noXCorrectionExecuted = 0;
                this.noZCorrectionExecuted = 0;
                this.executionFinished = false;
            };
            this.reset();

            this.begin = function(noActiveQubits) {
                this.noActiveQubits = noActiveQubits;
                this.commentary.push('Simulation Begin');
            };

            this.end = function() {
                this.executionFinished = true;
                this.commentary.push('Simulation End');
            };

            function commentQubit(n,indx) {
                return n+'['+indx+']';
            }

            this.prepareInput = function(instrNum, q, indx) {
                this.noCommandsExecuted++;
                this.noPrepareExecuted++;
                this.numActiveQubits++;
                this.commentary.push([instrNum,': Qubit ', commentQubit(q,indx), ' have been prepared in the given input state'].join(''));
            };
            this.prepare = function(instrNum, q, indx) {
                this.noCommandsExecuted++;
                this.noPrepareExecuted++;
                this.numActiveQubits++;
                this.commentary.push([instrNum,': Qubit ', commentQubit(q,indx), ' has been prepared in state |+>'].join(''));
            };
            this.entangle = function(instrNum, q1, q2, indx1, indx2) {
                this.noCommandsExecuted++;
                this.noEntangementExecuted++;
                this.commentary.push([instrNum,': Qubits ', commentQubit(q1,indx1),' and ',
                    commentQubit(q2,indx2),' have been entangled'].join(''));
            };
            this.measure = function(instrNum, q, indx, angle, sgamma, tgamma, outcome) {
                this.noCommandsExecuted++;
                this.noMeasurementExecuted++;
                this.noDestroyedQubits++;
                this.noActiveQubits--;
                this.commentary.push([instrNum,': Qubit ', commentQubit(q,indx),
                    ' was measured using basis alpha=', angle, '(s=',sgamma,'t=',tgamma,
                    '). The outcome was: s_',q,'=',outcome].join(''));
            };
            this.xcorrect = function(instrNum, q, indx, sgamma) {
                this.noCommandsExecuted++;
                this.noXCorrectionExecuted++;
                if (sgamma) {
                    this.commentary.push([instrNum,': Qubit ', commentQubit(q,indx),
                        ' was X-corrected (signal=1)'].join(''));
                } else {
                    this.commentary.push([instrNum,': Qubit ', commentQubit(q,indx),
                        ' was not X-corrected (signal=0)'].join(''));
                }
            };
            this.zcorrect = function(instrNum, q, indx, sgamma) {
                this.noCommandsExecuted++;
                this.noZCorrectionExecuted++;
                if (sgamma) {
                    this.commentary.push([instrNum,': Qubit ', commentQubit(q,indx),
                        ' was Z-corrected (signal=1)'].join(''));
                } else {
                    this.commentary.push([instrNum,': Qubit ', commentQubit(q,indx),
                        ' was not Z-corrected (signal=0)'].join(''));
                }
            };


        }

        return new SimulationLogger();
    }]);