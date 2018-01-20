'use strict';


angular.module('mbqc.services.latex-export', [])
    .factory('latexExport', ['pattern', function (pattern) {
        function LatexExporter() {
            this.exportPatterns = function (pats, rewrites, useSsForOutcomes) {
                var ret = '';
                for (var j = 0, p = pats.length; j < p; j++) {
                    for (var i = 0, l = pats[j].instructions.length; i < l; i++) {
                        var instr = pats[j].instructions[i];

                        // left signal + [
                        if (instr.signals.length >= 2 && instr.signals[1].length > 0) {
                            ret += '{}^{' + this.signalToLatex(instr.signals[1], useSsForOutcomes) + '}[';
                        }

                        // letter
                        ret += instr.letter;

                        // qubit(s)
                        ret += '_{';
                        if (instr.qubits.length >= 1) {
                            ret += instr.qubits[0];
                            if (instr.qubits.length >= 2) {
                                ret += instr.qubits[1];
                            }
                        }
                        ret += '}';

                        // ] + right signal
                        if (instr.signals.length >= 1) {
                            if (instr.signals.length >= 2 && instr.signals[1].length > 0) {
                                ret += ']';
                            }
                            if (instr.signals[0].length > 0) {
                                ret += '^{' + this.signalToLatex(instr.signals[0], useSsForOutcomes) + '}';
                            }
                        }
                    }
                    // if this is not the last pattern then do: newline + the rewrite rule used
                    if (j < p - 1) {
                        ret += '\\\\\\Rightarrow_{' + rewrites[j].rule.name + '}\\ ';
                    }
                }
                return ret;
            };
            this.signalToLatex = function (sig, useSsForOutcomes) {
                var ret = '';
                for (var i = 0, l = sig.length; i < l; i++) {
                    if (useSsForOutcomes) {
                        ret += 's_{' + sig[i] + '}';
                    } else {
                        ret += sig[i];
                    }
                    if (i < sig.length - 1) {
                        ret += '+'
                    }
                }
                return ret;
            }
        }

        return new LatexExporter();
    }]);