'use strict';


angular.module('mbqc.services.rewrite', [])
    .factory('rewrite', ['pattern', 'patternHelper', 'QubitIO', function (pattern, patternHelper, qubitIO) {
        // The rules found in p23 of Extended Measurement Calculus, Danos et al.
        function Rule() {
            this.name = '';
            this.lhsCount = 2;
            this.lhsInstrsBounds = function (index) {
                return [index, index + this.lhsCount - 1];
            };
            this.rhsInstrsBounds = function (index) {
                return [index, index + this.rhsCount - 1];
            };
            this.canRewrite = function (l, r, p) {
                return false;
            };
            this.canRewriteInstructionsAtIndex = function (pat, index) {
                var l = pat.instructions[index];
                var r = pat.instructions[index + 1];
                return (l != undefined && r != undefined && this.canRewrite(l, r, pat));
            };
            this.rewriteWith = function (l, r) {
                return [l, r];
            };
            this.rewriteInstructionsAtIndex = function (pat, index) {
                var l = pat.instructions[index];
                var r = pat.instructions[index + 1];
                if (l != undefined && r != undefined && l != null && r != null && this.canRewrite(l, r, pat)) {
                    // inserts [b1,..bk] into [a1..an] at index where B = return of rule.rewrite(l,r) and A = pattern
                    instrs.splice.apply(instrs, [index, 2].concat(this.rewriteWith(l, r)));
                    return instrs;
                }
            };
            this.rewrittenInstructionsAtIndex = function (pat, index) {
                var instrs = pat.instructions.slice(0);
                var l = pat.instructions[index];
                var r = pat.instructions[index + 1];
                if (l != undefined && r != undefined && l != null && r != null && this.canRewrite(l, r, pat)) {
                    // inserts [b1,..bk] into [a1..an] at index where B = return of rule.rewrite(l,r) and A = pattern
                    instrs.splice.apply(instrs, [index, 2].concat(this.rewriteWith(l, r)));
                    return instrs;
                }
            };
        }

        function EXRule() {
            this.name = 'EX';
            this.rhsCount = 3;
            this.canRewrite = function (e, x) {
                var xq = x.qubits[0];
                return (e instanceof pattern.Entanglement && x instanceof pattern.XCorrection)
                    && (e.qubits[0] == xq || e.qubits[1] == xq);
            };
            this.rewriteWith = function (e, x) {
                var zqubit = (e.qubits[0] == x.qubits[0]) ? e.qubits[1] : e.qubits[0];
                var zsignal = x.signals[0].slice(0);
                return [x, new pattern.ZCorrection(zqubit, zsignal), e];
            };
        }

        function EZRule() {
            this.name = 'EZ';
            this.rhsCount = 2;
            this.canRewrite = function (e, z) {
                var zq = z.qubits[0];
                return (e instanceof pattern.Entanglement && z instanceof pattern.ZCorrection
                    && (e.qubits[0] == zq || e.qubits[1] == zq));
            };
            this.rewriteWith = function (e, z) {
                return [z, e];
            };
        }

        function MXRule() {
            this.name = 'MX';
            this.rhsCount = 1;
            this.canRewrite = function (m, x) {
                return ((m instanceof pattern.Measurement) && (x instanceof pattern.XCorrection)
                    && (m.qubits[0] == x.qubits[0]));
            };
            this.rewriteWith = function (m, x) {
                var newm = new pattern.Measurement(m.qubits[0], m.angle, patternHelper.joinSignals(m.signals[0], x.signals[0]), m.signals[1]);
                return [newm];
            }
        }

        function MZRule() {
            this.name = 'MZ';
            this.rhsCount = 1;
            this.canRewrite = function (m, z) {
                return (m instanceof pattern.Measurement && z instanceof pattern.ZCorrection
                    && (m.qubits[0] == z.qubits[0]));
            };
            this.rewriteWith = function (m, z) {
                var newm = new pattern.Measurement(m.qubits[0], m.angle, m.signals[0], patternHelper.joinSignals(m.signals[1], z.signals[0]));
                return [newm];
            }
        }

        function CommuteEntangleRule() {
            this.name = 'CE';
            this.rhsCount = 2;
            this.canRewrite = function (e, a) {
                return (!(a instanceof pattern.Entanglement) && !(a instanceof pattern.Prepare)  && e instanceof pattern.Entanglement
                    && (patternHelper.disjointQubits(a.qubits, e.qubits)));
            };
            this.rewriteWith = function (e, a) {
                return [a, e];
            }
        }

        function CommuteXCorrectionRule() {
            this.name = 'CX';
            this.rhsCount = 2;
            this.canRewrite = function (a, x) {
                return (!(a instanceof pattern.Correction) && x instanceof pattern.XCorrection
                    && (patternHelper.disjointQubits(a.qubits, x.qubits)));
            };
            this.rewriteWith = function (a, x) {
                return [x, a];
            }
        }

        function CommuteZCorrectionRule() {
            this.name = 'CZ';
            this.rhsCount = 2;
            this.canRewrite = function (a, z) {
                return (!(a instanceof pattern.Correction) && z instanceof pattern.ZCorrection
                    && (patternHelper.disjointQubits(a.qubits, z.qubits)));
            };
            this.rewriteWith = function (a, z) {
                return [z, a];
            }
        }

        function CommutePreparationRule() {
            this.name = 'CN';
            this.rhsCount = 2;
            this.canRewrite = function (n, a, pat) {
                // we can only commute to the right preparations on input qubits
                return (n instanceof pattern.Prepare && !(a instanceof pattern.Prepare));
                    //&& (qubitIO.IsInput(pat.qubits[n.qubits[0]])));
            };
            this.rewriteWith = function (n, a) {
                return [a, n];
            };
        }

        var r = new Rule();
        EXRule.prototype = new Rule();
        var ex = new EXRule();
        EZRule.prototype = new Rule();
        var ez = new EZRule();
        MXRule.prototype = new Rule();
        var mx = new MXRule();
        MZRule.prototype = new Rule();
        var mz = new MZRule();
        CommuteEntangleRule.prototype = new Rule();
        var ce = new CommuteEntangleRule();
        CommuteXCorrectionRule.prototype = new Rule();
        var cx = new CommuteXCorrectionRule();
        CommuteZCorrectionRule.prototype = new Rule();
        var cz = new CommuteZCorrectionRule();
        CommutePreparationRule.prototype = new Rule();
        var cn = new CommutePreparationRule();

        var allrules = [ex, ez, mx, mz, ce, cx, cz, cn];

        function evaluatePossibleRules(pattern, possible, rules)
        {
            for (var x in possible[0]) { if (possible[0].hasOwnProperty(x)) { delete possible[0][x]; } }
            for (var y in possible[1]) { if (possible[1].hasOwnProperty(y)) { delete possible[1][y]; } }

            //possible[0].length = 0; possible[1].length = 0;
            rules = rules || allrules;
            for (var i = 0; i < pattern.instructions.length; i++) {
                angular.forEach(rules, function (rule) {
                    if (rule.canRewriteInstructionsAtIndex(pattern, i)) {
                        // Fill in normal map with index->rule
                        possible[0][i] = rule;
                        // Fill in inverse map with rule.name->index
                        if (possible[1][rule.name] == undefined) {
                            possible[1][rule.name] = [i];
                        } else {
                            possible[1][rule.name].push(i);
                        }
                    }
                });
            }
        }

        function addRewriteInfo(rule, index, step, rewrites, rewriteCounts)
        {
            rewriteCounts[rule.name]++;
            rewriteCounts['total']++;
            rewrites[step] = {
                rule: rule,
                from: rule.lhsInstrsBounds(index),
                to: rule.rhsInstrsBounds(index)
            };
        }

        function findStandardForm(pat, proof, rewrites, rewriteCounts)
        {
            proof.push(pat);
            var possibleRules = {}, possibleRulesInv = {};
            var phaseRules = [[cn], [cx, cz, ex, ez, mx, mz], [ce]];
            var shallAddRw = (rewrites != undefined && rewriteCounts != undefined);

            function performNextRewrite(rule) {
                var index = possibleRulesInv[rule.name][0];
                if (shallAddRw) addRewriteInfo(rule, index, proof.length-1, rewrites, rewriteCounts);
                proof.push(new pattern.Pattern (rule.rewrittenInstructionsAtIndex(proof[proof.length-1], index), {}));
            }
            function evaluateNextPossibleRules(rules) {
                evaluatePossibleRules(proof[proof.length-1], [possibleRules, possibleRulesInv], rules);
            }

            // Phase (i), repeatedly apply CN
            evaluateNextPossibleRules(phaseRules[0]);
            while (possibleRulesInv[cn.name] != undefined) {
                performNextRewrite(cn);
                evaluateNextPossibleRules(phaseRules[0]);
            }

            // Phase (ii), repeated apply CX, CZ, EX, EZ, MX, MZ
            evaluateNextPossibleRules(phaseRules[1]);
            var endOfPhase2 = false;
            while (!endOfPhase2)
            {
                // Linear search to see if any phase 2 rule is applicable
                var ruleIdx = 0, l = phaseRules[1].length; // i = index to phase 2 rules
                while (ruleIdx < l && possibleRulesInv[phaseRules[1][ruleIdx].name] == undefined) {ruleIdx++;}
                // MID: either i == phase2rs.length or inv[phase2rs[i].name] != undefined
                // if i == l, None of rules can be applied.
                // else inv[phase2rs[i].name] != undefined,
                //      so there is some rule that can be applied, so apply it, then start all again
                if (ruleIdx == l) {
                    endOfPhase2 = true;
                } else {
                    performNextRewrite(phaseRules[1][ruleIdx]);
                    evaluateNextPossibleRules(phaseRules[1]);
                }
            }
            evaluateNextPossibleRules(phaseRules[2]);
            // Phase (iii), repeated apply CE
            while (possibleRulesInv[ce.name] != undefined) {
                performNextRewrite(ce);
                evaluateNextPossibleRules(phaseRules[2]);
            }
        }

        return {
            Rule: r,
            EXRule: ex, EZRule: ez,
            MXRule: mx, MZRule: mz,
            CERule: ce, CXRule: cx, CZRule: cz, CNRule: cn,
            rules: [ex, ez, mx, mz, ce, cx, cz, cn],
            commuteRules: [ce, cx, cz, cn],
            evaluatePossibleRules: evaluatePossibleRules,
            findStandardForm: findStandardForm
        };
    }]);
