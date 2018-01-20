'use strict';


angular.module('mbqc.services.predefined-patterns', [])
    .factory('predefinedPatterns', ['pattern', 'QubitIO', 'expressionTree', 'compositionTree',
        function (pattern, QubitIO, et, compositionTree)
    {
        var minusalpha = new et.MinusNode().left(new et.IdentifierNode('α'));
        var minusbeta = new et.MinusNode().left(new et.IdentifierNode('β'));
        var minusgamma = new et.MinusNode().left(new et.IdentifierNode('γ'));
        var x = new et.IdentifierNode('x');
        var pi = new et.IdentifierNode('π');
        var qtype = compositionTree.COMPOSITION_PARAM_TYPES.QUBIT_NAME_TYPE;
        var angtype = compositionTree.COMPOSITION_PARAM_TYPES.ANGLE_TYPE;
        //
        var teleportation = new pattern.Pattern([
            new pattern.XCorrection(3, [2]),
            new pattern.Measurement(2, minusbeta, [], []),
            new pattern.Entanglement(2, 3),
            new pattern.Prepare(2),
            new pattern.XCorrection(2, [1]),
            new pattern.Measurement(1, minusalpha, [], []),
            new pattern.Entanglement(1, 2),
            new pattern.Prepare(3),
            new pattern.Prepare(2)],{1: QubitIO.In, 2: QubitIO.Neither, 3: QubitIO.Out});

        var teleportationNemc = new pattern.Pattern([
            new pattern.XCorrection(3, [2]),
            new pattern.ZCorrection(3, [1]),
            new pattern.Measurement(2, minusbeta, [1], []),
            new pattern.Measurement(1, minusalpha, [], []),
            new pattern.Entanglement(2, 3),
            new pattern.Entanglement(1, 2),
            new pattern.Prepare(3),
            new pattern.Prepare(2)],{1: QubitIO.In, 2: QubitIO.Neither, 3: QubitIO.Out});
        //

        var xrotation = new pattern.Pattern([
            new pattern.XCorrection(3, [2]),
            new pattern.Measurement(2, minusalpha, [], []),
            new pattern.Entanglement(2, 3),
            new pattern.Prepare(3),
            new pattern.XCorrection(2, [1]),
            new pattern.Measurement(1, x, [], []),
            new pattern.Entanglement(1, 2),
            new pattern.Prepare(2)],{1: QubitIO.In, 2: QubitIO.Neither, 3: QubitIO.Out});

        var xrotationNemc = new pattern.Pattern([
            new pattern.XCorrection(3, [2]),
            new pattern.ZCorrection(3, [1]),
            new pattern.Measurement(2, minusalpha, [1], []),
            new pattern.Measurement(1, x, [], []),
            new pattern.Entanglement(2, 3),
            new pattern.Entanglement(1, 2),
            new pattern.Prepare(3),
            new pattern.Prepare(2)],{1: QubitIO.In, 2: QubitIO.Neither, 3: QubitIO.Out});

        var zrotationWith5q = new pattern.Pattern([
            new pattern.XCorrection(5, [4]),
            new pattern.ZCorrection(5, [3]),
            new pattern.Measurement(4, x, [3], [2]),
            new pattern.Entanglement(5, 4),
            new pattern.Prepare(5),
            new pattern.XCorrection(4, [3]),
            new pattern.ZCorrection(4, [2]),
            new pattern.Measurement(3, minusalpha, [2], []),
            new pattern.Measurement(2, x, [], []),
            new pattern.Entanglement(3, 4),
            new pattern.Entanglement(2, 3),
            new pattern.XCorrection(2, [1]),
            new pattern.Measurement(1, x, [], []),
            new pattern.Entanglement(1, 2),
            new pattern.Prepare(5),
            new pattern.Prepare(4),
            new pattern.Prepare(3),
            new pattern.Prepare(2)],{1: QubitIO.In,
            2: QubitIO.Neither, 3: QubitIO.Neither, 4: QubitIO.Neither, 5: QubitIO.Out});

        var zrotation = new pattern.Pattern([
            new pattern.XCorrection(3, [2]),
            new pattern.Measurement(2, x, [], []),
            new pattern.Entanglement(2,3),
            new pattern.Prepare(3),
            new pattern.XCorrection(2,[1]),
            new pattern.Measurement(1, minusalpha, [], []),
            new pattern.Entanglement(1,2),
            new pattern.Prepare(2)
        ], {1:QubitIO.In, 2:QubitIO.Neither, 3:QubitIO.Out});

        var zrotationNemc = new pattern.Pattern([
            new pattern.XCorrection(3, [2]),
            new pattern.Measurement(2, x),
            new pattern.Entanglement(2,3),
            new pattern.XCorrection(2,[1]),
            new pattern.Measurement(1, minusalpha),
            new pattern.Entanglement(1,2),
            new pattern.Prepare(3),
            new pattern.Prepare(2)
        ], {1:QubitIO.In, 2:QubitIO.Neither, 3:QubitIO.Out});

        var zrotation5qNemc = new pattern.Pattern([
            new pattern.XCorrection(5, [4]),
            new pattern.ZCorrection(5, [3]),
            new pattern.Measurement(4, x, [3], [2]),
            new pattern.Measurement(3, minusalpha, [2], [1]),
            new pattern.Measurement(2, x, [], []),
            new pattern.Measurement(1, x, [], []),
            new pattern.Entanglement(5, 4),
            new pattern.Entanglement(4, 3),
            new pattern.Entanglement(3, 2),
            new pattern.Entanglement(1, 2),
            new pattern.Prepare(5),
            new pattern.Prepare(4),
            new pattern.Prepare(3)],{1: QubitIO.In,
            2: QubitIO.Neither, 3: QubitIO.Neither, 4: QubitIO.Neither, 5: QubitIO.Out});

        //

        var cnot = new pattern.Pattern([
            new pattern.XCorrection(4, [3]),
            new pattern.Measurement(3, x, [], []),
            new pattern.Entanglement(3, 4),
            new pattern.Entanglement(1, 3),
            new pattern.XCorrection(3, [2]),
            new pattern.Measurement(2, x, [], []),
            new pattern.Entanglement(2, 3),
            new pattern.Prepare(4),
            new pattern.Prepare(3)],{1: QubitIO.InOut,
            2: QubitIO.In, 3: QubitIO.Neither, 4: QubitIO.Out});

        var cnotNemc = new pattern.Pattern([
            new pattern.XCorrection(4, [3]),
            new pattern.ZCorrection(4, [2]),
            new pattern.ZCorrection(1, [2]),
            new pattern.Measurement(3, x, [], []),
            new pattern.Measurement(2, x, [], []),
            new pattern.Entanglement(3, 1),
            new pattern.Entanglement(3, 2),
            new pattern.Entanglement(3, 4),
            new pattern.Prepare(4),
            new pattern.Prepare(3)],{1: QubitIO.InOut,
            2: QubitIO.In, 3: QubitIO.Neither, 4: QubitIO.Out});

        //

        var hadamardNemc = new pattern.Pattern([
            new pattern.XCorrection(2, [1]),
            new pattern.Measurement(1, x, [], []),
            new pattern.Entanglement(1, 2),
            new pattern.Prepare(2)],{1: QubitIO.In, 2: QubitIO.Out});

        var uf2 = new pattern.Pattern([
            new pattern.XCorrection(5, [4]),
            new pattern.Measurement(4, pi, [], []),
            new pattern.Entanglement(4, 5),
            new pattern.Prepare(5),
            new pattern.XCorrection(4, [3]),
            new pattern.Measurement(3, x, [], []),
            new pattern.Entanglement(3, 4),
            new pattern.Prepare(4),
            new pattern.Entanglement(1, 3),
            new pattern.XCorrection(3, [2]),
            new pattern.Measurement(2, x, [], []),
            new pattern.Entanglement(2, 3),
            new pattern.Prepare(3)],
            {1: QubitIO.InOut, 2: QubitIO.In, 3:QubitIO.Neither, 4:QubitIO.Neither, 5:QubitIO.Out});


        // angles for the controlled-u pattern
        var ang1 = new et.DivisionNode()
            .left(
                new et.AdditionNode()
                .left(
                    new et.SubtractionNode()
                    .left(
                        new et.IdentifierNode('β')
                    ).right(
                        new et.IdentifierNode('δ')
                    )
                ).right(
                    new et.IdentifierNode('π')
                )
            ).right(
                new et.NumberNode(2)
            );

        var ang2 = new et.DivisionNode()
            .left(
            new et.AdditionNode()
                .left(
                new et.AdditionNode()
                    .left(
                    new et.IdentifierNode('π')
                ).right(
                    new et.IdentifierNode('δ')
                )
            ).right(
                new et.IdentifierNode('β')
            )
        ).right(
            new et.NumberNode(2)
        );

        var ang3 = new et.MinusNode().left(new et.DivisionNode().left(new et.IdentifierNode('γ')).right(new et.NumberNode(2)));
        var ang4 = new et.MinusNode().left(new et.DivisionNode().left(new et.IdentifierNode('π')).right(new et.NumberNode(2)));
        var ang5 = new et.DivisionNode().left(new et.IdentifierNode('π')).right(new et.NumberNode(2));
        var ang6 = new et.DivisionNode().left(new et.IdentifierNode('γ')).right(new et.NumberNode(2));
        var ang7 = new et.SubtractionNode().left(new et.MinusNode().left(new et.IdentifierNode('β'))).right(new et.IdentifierNode('π'));

        var ang8 = new et.AdditionNode()
        .left(new et.IdentifierNode('α'))
        .right(
            new et.DivisionNode()
                .left(
                    new et.AdditionNode().left(
                        new et.AdditionNode().left(
                            new et.IdentifierNode('β')
                        ).right(
                            new et.IdentifierNode('γ')
                        )
                    ).right(
                        new et.IdentifierNode('δ')
                    )
                )
                .right(
                    new et.NumberNode(2)
                )
        );

        var ctrlu = new pattern.Pattern([
            new pattern.XCorrection('C', ['B']),
            new pattern.Measurement('B', x, [], []),
            new pattern.Entanglement('B', 'C'),
            new pattern.XCorrection('B', ['A']),
            new pattern.Measurement('A', ang8, [], []),
            new pattern.Entanglement('A', 'B'),
            new pattern.XCorrection('k', ['j']),
            new pattern.Measurement('j', x, [], []),
            new pattern.Entanglement('j', 'k'),
            new pattern.XCorrection('j', ['i']),
            new pattern.Measurement('i', ang7, [], []),
            new pattern.Entanglement('i', 'j'),
            new pattern.XCorrection('i', ['h']),
            new pattern.Measurement('h', ang6, [], []),
            new pattern.Entanglement('h', 'i'),
            new pattern.XCorrection('h', ['g']),
            new pattern.Measurement('g', ang5, [], []),
            new pattern.Entanglement('g', 'h'),
            new pattern.XCorrection('g', ['f']),
            new pattern.Measurement('f', x, [], []),
            new pattern.Entanglement('f', 'g'),
            new pattern.Entanglement('A', 'f'),
            new pattern.XCorrection('f', ['e']),
            new pattern.Measurement('e', ang4, [], []),
            new pattern.Entanglement('e', 'f'),
            new pattern.XCorrection('e', ['d']),
            new pattern.Measurement('d', ang3, [], []),
            new pattern.Entanglement('d', 'e'),
            new pattern.XCorrection('d', ['c']),
            new pattern.Measurement('c', ang2, [], []),
            new pattern.Entanglement('c', 'd'),
            new pattern.XCorrection('c', ['b']),
            new pattern.Measurement('b', x, [], []),
            new pattern.Entanglement('b', 'c'),
            new pattern.Entanglement('A', 'b'),
            new pattern.XCorrection('b', ['a']),
            new pattern.Measurement('a', ang1, [], []),
            new pattern.Entanglement('a', 'b'),
            new pattern.Prepare('j'),
            new pattern.Prepare('i'),
            new pattern.Prepare('h'),
            new pattern.Prepare('g'),
            new pattern.Prepare('f'),
            new pattern.Prepare('e'),
            new pattern.Prepare('d'),
            new pattern.Prepare('c'),
            new pattern.Prepare('b'),
            new pattern.Prepare('B'),
            new pattern.Prepare('k'),
            new pattern.Prepare('C')],
            {'A': QubitIO.In, 'a': QubitIO.In, 'C': QubitIO.Out, 'k':QubitIO.Out,
             'B': QubitIO.Neither, 'b': QubitIO.Neither, 'c':QubitIO.Neither,
             'd': QubitIO.Neither, 'e': QubitIO.Neither, 'f':QubitIO.Neither,
             'g': QubitIO.Neither, 'h': QubitIO.Neither, 'i':QubitIO.Neither, 'j':QubitIO.Neither});

        var id = function(i) {
            var qubits = {};
            qubits[i] = QubitIO.InOut;
            return new pattern.Pattern([], qubits);
        };

        var j = function(angle, u, v) {
            var qubits = {};
            qubits[u] = QubitIO.In; qubits[v] = QubitIO.Out;
            return new pattern.Pattern([
                new pattern.XCorrection(v, [u]),
                new pattern.Measurement(u, angle, [], []),
                new pattern.Entanglement(u, v),
                new pattern.Prepare(v)], qubits);
        };

        var rx = function(angle, u, v, w) {
            var qubits = {};
            qubits[u] = QubitIO.In; qubits[v] = QubitIO.Neither; qubits[w] = QubitIO.Out;
            return new pattern.Pattern([
                new pattern.XCorrection(w, [v]),
                new pattern.Measurement(v, minusalpha, [u], []),
                new pattern.Entanglement(v, w),
                new pattern.XCorrection(v, [u]),
                new pattern.Measurement(u, x, [], []),
                new pattern.Entanglement(u, v),
                new pattern.Prepare(w),
                new pattern.Prepare(v)], qubits);
        };

        var cz = function(i, j) {
            var qubits = {};
            qubits[i] = QubitIO.InOut; qubits[j] = QubitIO.InOut;
            return new pattern.Pattern([new pattern.Entanglement(i, j)], qubits);
        };

        var h = function(u,v) {
            return j(x, u, v);
        };

        var chain = function(n) {
            var qubits = {}, instrs = [];
            for (var i = n; i > 1; i--) {
                instrs.push(new pattern.Entanglement(i, i-1))
            }
            for (i = n; i > 0; i--) {
                qubits[i] = QubitIO.Out;
                instrs.push(new pattern.Prepare(i))
            }
            return new pattern.Pattern(instrs, qubits);
        };




        /*********************************************************/
        /****************** COMPOSITE PATTERNS *******************/
        /*********************************************************/

        var generalRotationComp = new compositionTree.SequentialNode()
            .left(
                new compositionTree.SequentialNode()
                .left(
                    new compositionTree.PatternNode(j, 'J', ['0','4','5'], [angtype, qtype, qtype])
                )
                .right(
                    new compositionTree.PatternNode(j, 'J', ['-α','3','4'], [angtype, qtype, qtype])
                )
            )
            .right(
                new compositionTree.SequentialNode()
                .left(
                    new compositionTree.PatternNode(j, 'J', ['-β','2','3'], [angtype, qtype, qtype])
                )
                .right(
                    new compositionTree.PatternNode(j, 'J', ['-γ', '1','2'], [angtype, qtype, qtype])
                )
            );

        var cnotComp = new compositionTree.SequentialNode()
            .left(
                new compositionTree.SequentialNode()
                .left(
                        new compositionTree.ParallelNode()
                    .left(
                        new compositionTree.PatternNode(id, 'I', ['1'], [qtype])
                    )
                    .right(
                        new compositionTree.PatternNode(h, 'H', ['3','4'], [qtype,qtype])
                    )
                )
                .right(
                    new compositionTree.PatternNode(cz, 'CZ', ['1','3'], [qtype,qtype])
                )
        )
        .right(
            new compositionTree.ParallelNode()
            .left(
                new compositionTree.PatternNode(id, 'I', ['1'], [qtype])
            )
            .right(
                new compositionTree.PatternNode(h, 'H', ['2','3'], [qtype,qtype])
            )
        );


        var zrotationWith5qComp = new compositionTree.SequentialNode()
            .left(
                new compositionTree.SequentialNode()
                .left(
                    new compositionTree.PatternNode(h, 'H', ['4','5'], [qtype,qtype])
                )
                .right(
                    new compositionTree.PatternNode(rx, 'Rx', ['α','2','3','4'], [angtype,qtype,qtype,qtype])
                )
            )
            .right(
                new compositionTree.PatternNode(h, 'H', ['1','2'], [qtype,qtype])
            );


        return {
            teleportation: teleportation,
            xrotation: xrotation,
            zrotation: zrotation,
            zrotationWith5q: zrotationWith5q,
            cnot: cnot,
            ctrlu: ctrlu,
            //
            teleportationNemc: teleportationNemc,
            xrotationNemc: xrotationNemc,
            zrotationNemc: zrotationNemc,
            cnotNemc: cnotNemc,
            hadamardNemc: hadamardNemc,
            ctrluNemc: ctrlu,
            zrotation5qNemc: zrotation5qNemc,
            id: id,
            j: j,
            cz : cz,
            h: h,
            chain: chain,
            uf2: uf2,
            //
            composite : {
                generalRotation : generalRotationComp,
                zRotationWith5q : zrotationWith5qComp,
                cnot: cnotComp
            }
        };

    }]);