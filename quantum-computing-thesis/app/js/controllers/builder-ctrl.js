'use strict';


angular.module('mbqc.controllers.builderCtrl', [])
    .controller('builderCtrl', ['pattern', 'QubitIO', '$scope', '$rootScope', '$templateCache', 'rewrite', 'patternHelper',
        'predefinedPatterns',  'compositionTree', 'angleParser',
        function (pattern, QubitIO, $scope, $rootScope, t, rewrite, patternHelper, predefinedPatterns,
                  compositionTree, angleParser)
        {

            // maps keycodes to appropriate instrBuildSteps letter/qubit names
            var keysInstrToLetter = {78: 'N', 69: 'E', 77 : 'M', 90 : 'Z', 88 : 'X'};
            var keysToQubitNames = {48: 0, 49: 1, 50: 2, 51: 3, 52: 4, 53: 5, 54: 6, 55: 7, 56: 8, 57: 9};
            var keysToSignalConsts = {48: pattern.SIGNAL_ZERO, 49: pattern.SIGNAL_ONE};
            //
            var keysToAngleSymbols = {48: 0, 49: 1, 50: 2, 51: 3, 52: 4, 53: 5, 54: 6, 55: 7, 56: 8, 57: 9,
                                        65:'α', 66:'β', 71:'γ', 80:'π'};
            //var keysToAngleSymbolsWithShift = {};
            // inverse maps
            var instrLetterTokey = {'N':78, 'E':69,'M': 77, 'Z':90, 'X': 88};
            var qubitNameToKey = {0:48, 1:49, 2:50, 3:51, 4:52, 5:53, 6:54, 7:55, 8:56, 9:57};


            $scope.keydown = function(keyEvent) {
                $scope.mykeyevent(keyEvent);
            };

            $scope.focus = function() {
                $scope.isBuilderFocus = true;
            };

            $scope.blur = function() {
                $scope.isBuilderFocus = false;
            };

            $scope.inCommandMode = true;
            $scope.setCommandMode = function(b) {
                $scope.inCommandMode = b;
            };

            $scope.showCommandPredef = false;
            $scope.toggleCommandPredef = function() {
                $scope.showCommandPredef = !$scope.showCommandPredef;
            };
            $scope.showComposePredef = false;
            $scope.toggleComposePredef = function() {
                $scope.showComposePredef = !$scope.showComposePredef;
            };

            $scope.mykeyevent = function mykeyevent(event)
            {
                if ($scope.inCommandMode) {
                    commandKeyEvent(event)
                } else {
                    composeKeyEvent(event)
                }
            };


            // maps keycodes to appropriate instrBuildSteps letter/qubit names
            // o == sequential composition
            // x == parallel composition
            var keysForComposition = {79: 'o', 88: 'x', 73:'i', 72:'h', 67:'c',74: 'j'};

            function composeKeyEvent(event)
            {
                var k = event.keyCode;
                if (k == 37)
                {
                    moveComposeCursorLeft();
                }
                else if (k == 39)
                {
                    moveComposeCursorRight();
                }
                else if (k == 79)
                {
                    $scope.addCompose();
                }
                else if (k == 88)
                {
                    $scope.addTensor();
                }
                else if (k == 8)
                {
                    event.preventDefault(); // prevent browser navigating back
                    $scope.backspace();
                }
                else if (k == 73)
                {
                    $scope.addIdentityPattern();
                }
                else if (k == 72)
                {
                    $scope.addHadamardPattern();
                }
                else if (k == 67)
                {
                    $scope.addControlledZPattern();
                }
                else if (k == 74)
                {
                    $scope.addSingleParamFamilyPattern();
                }
                else {
                    composeInsert(event.keyCode, event.shiftKey);
                }
            }




            var inorderMarkings = [];
            function inorderTraverse() {
                inorderMarkings = [];
                var stack = [];
                var u = $scope.node;
                while (stack.length != 0 || u != null) {
                    if (u != null) {
                        stack.push(u);
                        u = (u.l != null) ? u.l[0] : null;
                    } else {
                        u = stack.pop();
                        u.inorderMarking = inorderMarkings.length;
                        inorderMarkings.push(u);
                        u = (u.r != null) ? u.r[0] : null;
                    }
                }
            }

            function moveComposeCursorLeft()
            {
                var c = $scope.cursorNode;
                if (c.cursorleft)
                {
                    // move cursor from left of node to a new node
                    removeCursorsFromNode(c);
                    inorderTraverse();
                    var currentMarking = $scope.cursorNode.inorderMarking;
                    if (currentMarking > 0) {
                        $scope.cursorNode = inorderMarkings[currentMarking - 1];
                        setRightCursor($scope.cursorNode);
                    } else {
                        setLeftCursor($scope.cursorNode)
                    }
                    $scope.cursorParamIndex = -1;
                }
                else if (c instanceof compositionTree.PatternNode)
                {
                    if ($scope.cursorParamIndex > 0) {
                        // move the cursor within the parameters of the current pattern node
                        $scope.cursorParamIndex--;
                    }
                    else if ($scope.cursorParamIndex == 0) {
                        $scope.cursorParamIndex = -1;
                        setLeftCursor(c);
                    }
                    else if (c.cursorright) {
                        $scope.cursorParamIndex = $scope.cursorNode.params.length - 1;
                        removeCursorsFromNode(c);
                    }
                } else if (c.cursorright) {
                    setLeftCursor(c);
                }
            }

            function moveComposeCursorRight()
            {
                var c = $scope.cursorNode;
                if (c.cursorright)
                {
                    // move cursor from right of node to a new node
                    removeCursorsFromNode(c);
                    inorderTraverse();
                    var currentMarking = $scope.cursorNode.inorderMarking;
                    if (currentMarking < inorderMarkings.length - 1) {
                        $scope.cursorNode = inorderMarkings[currentMarking + 1];
                        setLeftCursor($scope.cursorNode);
                    } else {
                        setRightCursor($scope.cursorNode)
                    }
                    $scope.cursorParamIndex = -1;
                }
                else if (c instanceof compositionTree.PatternNode)
                {
                    if (c.cursorleft)
                    {
                        $scope.cursorParamIndex = 0;
                        removeCursorsFromNode(c);
                    }
                    else if ($scope.cursorParamIndex < c.params.length - 1) {
                        // move the cursor within the parameters of the current pattern node
                        $scope.cursorParamIndex++;
                    }
                    else if ($scope.cursorParamIndex >= c.params.length - 1) {
                        $scope.cursorParamIndex = -1;
                        setRightCursor(c);
                    }
                } else if (c.cursorleft) {
                    setRightCursor(c);
                }

            }

            function removeCursorsFromNode(node)  {
                node.cursorleft = false;  node.cursorright = false;
            }
            function setLeftCursor(node) {
                node.cursorleft = true; node.cursorright = false;
            }
            function setRightCursor(node) {
                node.cursorleft = false; node.cursorright = true;
            }

            function addPattern(newPatternNode) {
                var c = $scope.cursorNode;
                if (c instanceof compositionTree.PlaceHolderNode)
                {
                    if (c.parentNode != null) {
                        // set the parent of c (if there is one) to point to the operator node
                        if (c.parentNode.l && c.parentNode.l[0] == c) {c.parentNode.l[0] = newPatternNode;}
                        if (c.parentNode.r && c.parentNode.r[0] == c) {c.parentNode.r[0] = newPatternNode;}
                        newPatternNode.parentNode = c.parentNode;
                    }
                    if ($scope.node == c) {$scope.node = newPatternNode;}
                    $scope.cursorNode = newPatternNode;
                    setLeftCursor(newPatternNode);
                    moveComposeCursorRight();
                }
            }

            function addOperator(newOperatorNode) {
                $scope.cursorParamIndex = -1;
                var c = $scope.cursorNode;
                if (c.parentNode != null) {
                    // set the parent of c (if there is one) to point to the operator node
                    if (c.parentNode.l && c.parentNode.l[0] == c) {c.parentNode.l[0] = newOperatorNode;}
                    if (c.parentNode.r && c.parentNode.r[0] == c) {c.parentNode.r[0] = newOperatorNode;}
                    newOperatorNode.parentNode = c.parentNode;
                }
                // if c == root, then set the root to be the operator node
                if ($scope.node == c) {$scope.node = newOperatorNode;}

                var p = new compositionTree.PlaceHolderNode();

                // c.cursorleft == true, cursor is on the left of the node, so add operator to left
                // otherwise cursor is on the right, so add operator to left
                if (c.cursorleft) {
                    newOperatorNode.left(p).right(c);
                    setRightCursor(p);
                    $scope.cursorNode = p;
                } else {
                    newOperatorNode.left(c).right(p);
                    $scope.cursorNode = p;
                    setLeftCursor(p);
                }
                removeCursorsFromNode(c);
            }

            function deletePatternNode() {
                $scope.cursorParamIndex = -1;
                var c = $scope.cursorNode;
                if (c instanceof compositionTree.PatternNode)
                {
                    var newplaceholder = new compositionTree.PlaceHolderNode();
                    if (c.parentNode != null) {
                        // set the parent of c (if there is one) to point to the operator node
                        if (c.parentNode.l && c.parentNode.l[0] == c) {c.parentNode.l[0] = newplaceholder;}
                        if (c.parentNode.r && c.parentNode.r[0] == c) {c.parentNode.r[0] = newplaceholder;}
                        newplaceholder.parentNode = c.parentNode;
                    }
                    removeCursorsFromNode(c);
                    if ($scope.node == c) {$scope.node = newplaceholder;}
                    $scope.cursorNode = newplaceholder;
                    setLeftCursor(newplaceholder);
                }
            }

            function deleteOperatorNode() {
                $scope.cursorParamIndex = -1;
                var c = $scope.cursorNode;
                if (c instanceof compositionTree.SequentialNode ||
                    c instanceof compositionTree.ParallelNode)
                {
                    var newplaceholder = new compositionTree.PlaceHolderNode();
                    if (c.parentNode != null) {
                        // set the parent of c (if there is one) to point to the operator node
                        if (c.parentNode.l && c.parentNode.l[0] == c) {c.parentNode.l[0] = newplaceholder;}
                        if (c.parentNode.r && c.parentNode.r[0] == c) {c.parentNode.r[0] = newplaceholder;}
                        newplaceholder.parentNode = c.parentNode;
                    }
                    if ($scope.node == c) {$scope.node = newplaceholder;}
                    $scope.cursorNode = newplaceholder;
                    setLeftCursor(newplaceholder);
                }
            }

            //function add

            $scope.addCompose = function() {
                addOperator(new compositionTree.SequentialNode());
            };

            $scope.addTensor = function() {
                addOperator(new compositionTree.ParallelNode());
            };

            $scope.addIdentityPattern = function() {
                addPattern(new compositionTree.PatternNode(
                    predefinedPatterns.id, 'I', [null],
                    [compositionTree.COMPOSITION_PARAM_TYPES.QUBIT_NAME_TYPE]
                ))
            };
            $scope.addHadamardPattern = function() {
                var t = compositionTree.COMPOSITION_PARAM_TYPES.QUBIT_NAME_TYPE;
                addPattern(new compositionTree.PatternNode(predefinedPatterns.h, 'H', [null,null], [t,t]) )
            };
            $scope.addControlledZPattern = function() {
                var t = compositionTree.COMPOSITION_PARAM_TYPES.QUBIT_NAME_TYPE;
                addPattern(new compositionTree.PatternNode(predefinedPatterns.cz, 'CZ', [null,null], [t,t]) )
            };
            $scope.addSingleParamFamilyPattern = function() {
                var t = compositionTree.COMPOSITION_PARAM_TYPES;
                addPattern(new compositionTree.PatternNode(predefinedPatterns.j, 'J',
                    [null, null, null], [t.ANGLE_TYPE, t.QUBIT_NAME_TYPE, t.QUBIT_NAME_TYPE]) )
            };

            $scope.$watch('cursorParamIndex', function(value) {
                if (value >= 0) {
                    $scope.cursorParamType = $scope.cursorNode.paramTypes[value];
                }
                if (value == -1) {
                    $scope.cursorParamType = null;
                }
            });

            $scope.isCursorOnQubitParam = function() {
                return $scope.cursorParamType == compositionTree.COMPOSITION_PARAM_TYPES.QUBIT_NAME_TYPE;
            };

            $scope.isCursorOnAngleParam = function() {
                return $scope.cursorParamType == compositionTree.COMPOSITION_PARAM_TYPES.ANGLE_TYPE;
            };

            function composeInsert(key, shiftisOn)
            {
                if ($scope.isCursorOnQubitParam() && keysToQubitNames.hasOwnProperty(key)) {
                    $scope.cursorNode.params[$scope.cursorParamIndex] = keysToQubitNames[key];
                    moveComposeCursorRight();
                }
                else if ($scope.isCursorOnAngleParam() && keysToAngleSymbols.hasOwnProperty(key)) {
                    var params = $scope.cursorNode.params;
                    params[$scope.cursorParamIndex] = params[$scope.cursorParamIndex] == null
                        ? '' + keysToAngleSymbols[key]
                        : params[$scope.cursorParamIndex] + keysToAngleSymbols[key];
                    //moveComposeCursorRight();
                }
            }






            $scope.backspace = function() {
                var c = $scope.cursorNode;
                if (c instanceof compositionTree.PatternNode)
                {
                    var atstart = $scope.cursorParamIndex == 0;
                    var noparam = $scope.cursorNode.params[$scope.cursorParamIndex] == null;
                    if (atstart && noparam) {
                        // delete the pattern and replace with placeholder
                        deletePatternNode();
                    } else if (!atstart && noparam) {
                        moveComposeCursorLeft();
                    } else {
                        $scope.cursorNode.params[$scope.cursorParamIndex] = null;
                    }

                }
                else if (c instanceof compositionTree.PlaceHolderNode)
                {
                    // try to move the cursor to a parent operator node
                    if (c.parentNode != null) {
                        removeCursorsFromNode(c);
                        setLeftCursor(c.parentNode);
                        $scope.cursorNode = c.parentNode;
                    }
                }
                else if (c instanceof compositionTree.SequentialNode ||
                        c instanceof compositionTree.ParallelNode)
                {
                    // delete the node and the left and right children
                    deleteOperatorNode();
                }
            };

            //$scope.node = predefinedPatterns.composite.cnot;
            $scope.node = new compositionTree.PlaceHolderNode();

            $scope.cursorNode = $scope.node;
            $scope.cursorNode.cursorleft = true;
            $scope.cursorParamIndex = -1;

            //$scope.compositionTree = predefinedPatterns.composite.cnot;


            $scope.predef = function(name)
            {
                if ($scope.inCommandMode)
                {
                    var nameToPattern = {};
                    nameToPattern['teleportation'] = predefinedPatterns.teleportation;
                    nameToPattern['xrotation'] = predefinedPatterns.xrotation;
                    nameToPattern['zrotation'] = predefinedPatterns.zrotation;
                    nameToPattern['zrotationWith5q'] = predefinedPatterns.zrotationWith5q;
                    nameToPattern['cnot'] =  predefinedPatterns.cnot;
                    nameToPattern['ctrlu'] =  predefinedPatterns.ctrlu;
                    nameToPattern['hadamardNemc'] =  predefinedPatterns.hadamardNemc;
                    nameToPattern['uf2'] =  predefinedPatterns.uf2;
                    //
                    if (nameToPattern.hasOwnProperty(name)) {
                        // TODO: add cloning! we need clone the predef pattern
                        $scope.buildInstructions = nameToPattern[name].instructions;
                        $scope.buildQubits = nameToPattern[name].qubits;
                    }
                } else {
                    var nameToPattern = {};
                    nameToPattern['generalRotation'] = predefinedPatterns.composite.generalRotation;
                    nameToPattern['zrotationWith5q'] = predefinedPatterns.composite.zRotationWith5q;
                    nameToPattern['cnot'] = predefinedPatterns.composite.cnot;
                    //
                    if (nameToPattern.hasOwnProperty(name)) {
                        // TODO: add cloning! we need clone the predef pattern
                        //$scope.compositionTree = nameToPattern[name];
                        $scope.node = nameToPattern[name];
                    }

                }

                //
                /*nameToPattern['teleportationNemc'] = predefinedPatterns.teleportationNemc;
                nameToPattern['xrotationNemc'] = predefinedPatterns.xrotationNemc;
                nameToPattern['zrotationNemc'] = predefinedPatterns.zrotationNemc;
                nameToPattern['cnotNemc'] =  predefinedPatterns.cnotNemc;

                nameToPattern['ctrluNemc'] =  predefinedPatterns.ctrluNemc;*/


            };

            /*********************************************************************************/




            $scope.qubitio = QubitIO;
            $scope.builderfocus = false;
            $scope.buildQubits = {1: QubitIO.Unused, 2: QubitIO.Unused, 3: QubitIO.Unused, 4: QubitIO.Unused};
            $scope.qubitToggleCycle = {};
            $scope.qubitToggleCycle[QubitIO.Unused] = QubitIO.Neither;
            $scope.qubitToggleCycle[QubitIO.Neither] = QubitIO.In;
            $scope.qubitToggleCycle[QubitIO.In] = QubitIO.Out;
            $scope.qubitToggleCycle[QubitIO.Out] = QubitIO.InOut;
            $scope.qubitToggleCycle[QubitIO.InOut] = QubitIO.Unused;

            $scope.toggleQubit = function(key) {
                $scope.buildQubits[key] = $scope.qubitToggleCycle[$scope.buildQubits[key]];
            };

            /*********************************************************************************/

            $scope.buildInstructions = [];

            // either (i) index of instruction is the cursor inside (buildSubStep > 0)
            // or (ii) index of the next instruction to be added (buildSubStep == 0)
            $scope.cursorInstrIndex = 0;

            // the letter of the instruction currently being built
            // (or null if no instruction currently being build)
            $scope.currentStepLetter = null;

            // the current step of the instruction currently being built
            $scope.buildSubStep = 0;

            $scope.buildCursorIndexAtRightEnd = function() {
                return $scope.cursorInstrIndex == $scope.buildInstructions.length;
            };

            // possible build steps types per instruction
            var STEP_TYPES = {AddInstr: 0, AddQubit: 1, AddSignal: 2, AddAngle: 3};

            // maps a given instruction type to the step building fn + info about steps
            var instrBuildSteps = {
                'N' : [
                    [STEP_TYPES.AddInstr, STEP_TYPES.AddQubit],
                    [function () {return new pattern.Prepare()}, 0]
                ],
                'E' : [
                    [STEP_TYPES.AddInstr, STEP_TYPES.AddQubit, STEP_TYPES.AddQubit],
                    [function () {return new pattern.Entanglement()}, 0, 1]
                ],
                'M' : [
                    [STEP_TYPES.AddInstr, STEP_TYPES.AddQubit,STEP_TYPES.AddSignal, STEP_TYPES.AddSignal],
                    [function () {return new pattern.Measurement(null, 0, [], [])}, 0, 0, 1]
                ],
                'Z' : [
                    [STEP_TYPES.AddInstr, STEP_TYPES.AddQubit,STEP_TYPES.AddSignal],
                    [function () {return new pattern.ZCorrection(null, [])}, 0, 0]
                ],
                'X' : [
                    [STEP_TYPES.AddInstr, STEP_TYPES.AddQubit,STEP_TYPES.AddSignal],
                    [function () {return new pattern.XCorrection(null, [])}, 0, 0]
                ]
            };




            function getCurrentStepType() {
                return ($scope.currentStepLetter == null) ? STEP_TYPES.AddInstr
                    : instrBuildSteps[$scope.currentStepLetter][0][$scope.buildSubStep];
            }
            function getCurrentStepParam() {
                return ($scope.currentStepLetter == null) ? null
                    : instrBuildSteps[$scope.currentStepLetter][1][$scope.buildSubStep];
            }
            function getCurrentInstr() {
                return $scope.buildInstructions[$scope.cursorInstrIndex];
            }
            function getCurrentNumberOfSteps() {
                return instrBuildSteps[$scope.currentStepLetter][0].length;
            }
            $scope.isInstrType = function(type) {
                return getCurrentStepType() == STEP_TYPES[type];
            };


            function commandKeyEvent(event)
            {
                var k = event.keyCode;
                if (k == 8)
                {
                    // Deleting - backspace pressed
                    //$scope.buildBackFn();
                    event.preventDefault(); // prevent browser navigating back
                    $scope.buildInstructions.splice($scope.cursorInstrIndex, 1);
                }
                else if (k == 37)
                {
                    // left arrow
                    $scope.buildSubStep = 0;
                    $scope.currentStepLetter = null;
                    $scope.cursorInstrIndex = Math.max($scope.cursorInstrIndex-1, 0);
                }
                else if (k == 39)
                {
                    // right arrow
                    $scope.buildSubStep = 0;
                    $scope.currentStepLetter = null;
                    $scope.cursorInstrIndex = Math.min($scope.cursorInstrIndex+1, $scope.buildInstructions.length);
                }
                else if (k == 40)
                {
                    // down arrow
                }
                else
                {
                    commandInsert(event.keyCode, event.shiftKey);
                }
            }

            $scope.insert = function(keyName)
            {
                var insertfn = ($scope.inCommandMode) ? commandInsert : composeInsert;
                if (instrLetterTokey.hasOwnProperty(keyName)) {
                    insertfn(instrLetterTokey[keyName], false);
                }
                if (qubitNameToKey.hasOwnProperty(keyName)) {
                    insertfn(qubitNameToKey[keyName], false);
                }
                if (keyName == 'space') {
                    insertfn(32, false);
                }
            };


            function commandInsert(key, shiftisOn)
            {
                if ($scope.buildSubStep == 0 && keysInstrToLetter.hasOwnProperty(key)) {
                    $scope.currentStepLetter = keysInstrToLetter[key];
                }
                if (attemptToInsert(getCurrentStepType(),getCurrentStepParam(),getCurrentInstr(), key, shiftisOn))
                {
                    // successful insertion
                    if ($scope.buildSubStep == getCurrentNumberOfSteps() - 1)
                    {
                        // if we just finished the last insertion for that instruction
                        $scope.currentStepLetter = null;
                        $scope.buildSubStep = 0;
                    }
                    else
                    {
                        $scope.buildSubStep++;
                    }
                }
            }



            function attemptToInsert (currentStepBuildType, currentStepBuildParam, currentInstr, key, shiftisOn)
            {
                var k = key;
                if (currentStepBuildType == STEP_TYPES.AddInstr)
                {
                    if (keysInstrToLetter.hasOwnProperty(k)) {
                        $scope.buildInstructions.splice($scope.cursorInstrIndex, 0, currentStepBuildParam());
                        return true;
                    }
                }
                else if (currentStepBuildType == STEP_TYPES.AddQubit)
                {
                    if (keysToQubitNames.hasOwnProperty(k)) {
                        currentInstr.qubits[currentStepBuildParam] = keysToQubitNames[k];
                        return true;
                    }
                }
                else if (currentStepBuildType == STEP_TYPES.AddSignal)
                {
                    var keyMap = (shiftisOn) ? keysToSignalConsts : keysToQubitNames;
                    if (keyMap.hasOwnProperty(k)) {
                        currentInstr.signals[currentStepBuildParam].push(keyMap[k]);
                        return false;
                    }
                    if (k == 32) { return true; }
                } else {
                    return false;
                }
            }


            /*********************************************************************************/


            $scope.acceptBuild = function()
            {
                if ($scope.inCommandMode) {
                    acceptCommands();
                } else {
                    acceptCompose();
                }
            };

            function acceptCommands() {
                // only use qubits that are not unused
                // to through all the qubits and copy them as long as they are not QubitIO.Unused
                var potentialQubits = {};
                for(var key in $scope.buildQubits) {
                    if ($scope.buildQubits.hasOwnProperty(key))
                    {
                        var value = $scope.buildQubits[key];
                        if (value != QubitIO.Unused) {
                            potentialQubits[key] = value;
                        }
                    }
                }

                // build the pattern and check that it is valid wrt the qubit io
                // if it is, then emit a message saying the build is ok
                // if it is not valid, we log conditions D0,..D3.
                var potentialPattern = new pattern.Pattern($scope.buildInstructions.slice(0), potentialQubits);
                if (potentialPattern.isValidPattern()) {
                    $scope.$emit('buildAccepted', potentialPattern);
                } else {
                    $scope.$emit('buildRejected', potentialPattern);
                }
            }

            function acceptCompose() {
                $scope.$emit('buildAccepted', $scope.node.evaluate());
            }



        }]);
