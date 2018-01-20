angular.module('mbqc.services.evaluation', [])
    .factory('evaluation', ['pattern', 'QubitIO', 'rewrite',
        'predefinedPatterns', 'simulation', 'compositionTree', 'expressionTree', 'angleParser', 'flowAnalyser',
        'predefinedOpenGraphs', 'quantumMath',
        function (pattern, QubitIO, rewrite, predefinedPatterns, sim, ct, et, ap, fa, predefinedOgs, qm) {
            var vf = qm.vectorFactory;
            function standardFormPerformance() {
                /*var suite = new Benchmark.Suite;
                 //var rewriteCounts = {};
                 suite.add('standardform#teleportation', function() {
                 rewrite.findStandardForm(predefinedPatterns.teleportation, [], [], {});
                 })
                 .on('cycle', function(event) {
                 console.log(String(event.target));
                 })
                 .on('complete', function() {
                 console.log('Fastest is ' + this.filter('fastest').pluck('name'));
                 console.log('stdev:' + this[0].stats.deviation);
                 })
                 .run({ 'async': true });
                 //
                 //
                 //
                 var suite2 = new Benchmark.Suite;
                 suite2.add('standardform#xrotation', function() {
                 rewrite.findStandardForm(predefinedPatterns.xrotation, [], [], {});
                 })
                 .on('cycle', function(event) {
                 console.log(String(event.target));
                 })
                 .on('complete', function() {
                 console.log('Fastest is ' + this.filter('fastest').pluck('name'));
                 console.log('stdev:' + this[0].stats.deviation);
                 })
                 .run({ 'async': true });
                 //
                 //
                 //
                 var suite3 = new Benchmark.Suite;
                 suite3.add('standardform#cnot', function() {
                 rewrite.findStandardForm(predefinedPatterns.cnot, [], [], {});
                 })
                 .on('cycle', function(event) {
                 console.log(String(event.target));
                 })
                 .on('complete', function() {
                 console.log('Fastest is ' + this.filter('fastest').pluck('name'));
                 console.log('stdev:' + this[0].stats.deviation);
                 })
                 .run({ 'async': true });*/
                //
                /*var suite4 = new Benchmark.Suite;
                 var proof = [];
                 suite4.add('standardform#zrotation', function() {
                 rewrite.findStandardForm(predefinedPatterns.zrotation, proof,  [], {});
                 })
                 .on('cycle', function(event) {
                 console.log(String(event.target));
                 })
                 .on('complete', function() {
                 console.log('Fastest is ' + this.filter('fastest').pluck('name'));
                 console.log('stdev:' + this[0].stats.deviation);
                 console.log(proof)
                 })
                 .run({ 'async': true });*/

                /*
                 //
                 var suite5 = new Benchmark.Suite;
                 suite5.add('standardform#hadamard', function() {
                 rewrite.findStandardForm(predefinedPatterns.hadamardNemc, [], [], {});
                 })
                 .on('cycle', function(event) {
                 console.log(String(event.target));
                 })
                 .on('complete', function() {
                 console.log('Fastest is ' + this.filter('fastest').pluck('name'));
                 console.log('stdev:' + this[0].stats.deviation);
                 })
                 .run({ 'async': true });*/

                /*var suite6 = new Benchmark.Suite;
                 suite6.add('standardform#hadamard', function() {
                 rewrite.findStandardForm(predefinedPatterns.ctrlu, [], [], {});
                 })
                 .on('cycle', function(event) {
                 console.log(String(event.target));
                 })
                 .on('complete', function() {
                 console.log('Fastest is ' + this.filter('fastest').pluck('name'));
                 console.log('stdev:' + this[0].stats.deviation + '\n');
                 })
                 .run({ 'async': true });*/



                //sim.begin(predefinedPatterns.chain(10), {}, {}, null);
                //sim.ru

                //sim.begin(predefinedPatterns.chain(11), {}, {}, null);
                //sim.runAll();
                //randomMeasure(8);
                //analyseFlow()

                //hadamard(5);

                simulationTime();
            }

            function chainLength(n) {
                var suite6 = new Benchmark.Suite;
                suite6.add('chain' + n, function () {
                    sim.begin(predefinedPatterns.chain(n), {}, {}, null);
                    sim.runAll();
                })
                    .on('cycle', function (event) {
                        console.log(String(event.target));
                    })
                    .on('complete', function () {
                        console.log('Fastest is ' + this.filter('fastest').pluck('name'));
                        console.log('stdev:' + this[0].stats.deviation + '\n');
                        console.log('');
                    }).run({ 'async': true });
            }

            function hadamard(n)
            {
                var hs = new ct.LeafNode(predefinedPatterns.h(1,2));
                var inputs = {1:vf.zero()};
                for (var i = 2; i <= n; i++) {
                    hs = new ct.ParallelNode()
                        .left(new ct.LeafNode(predefinedPatterns.h(2*i-1, 2*i))).right(hs);
                    inputs[2*i-1] = vf.zero();
                }
                var pattern = hs.evaluate();
                //sim.begin(pattern, {}, inputs, null);
                //sim.runAll();
                var suite6 = new Benchmark.Suite;
                suite6.add('hadamard' + n, function () {
                    sim.begin(pattern, {}, inputs, null);
                    sim.runAll();
                })
                .on('cycle', function (event) {
                    console.log(String(event.target));
                })
                .on('complete', function () {
                    console.log('Fastest is ' + this.filter('fastest').pluck('name'));
                    console.log('stdev:' + this[0].stats.deviation + '\n');
                    console.log('');
                })
                .run({ 'async': true });
            }


            function arbitraryMeasure() {
                var qubits = {}, instrs = [];
                var x = ap.performParse('x');
                instrs.push(new pattern.Measurement(1, x, [], []));
                var pat = new pattern.Pattern(instrs, qubits);
                sim.begin(pat, {}, {1: vf.minus()}, null);
                sim.runAll();
            }

            function arbitraryEntangle() {
                var qubits = {1: QubitIO.In, 2 : QubitIO.In}, instrs = [];
                var x = ap.performParse('x');
                instrs.push(new pattern.Entanglement(1, 2));
                var pat = new pattern.Pattern(instrs, qubits);
                sim.begin(pat, {}, {1: vf.plus(), 2: qm.scaleVector(-1,vf.plus())}, null);
                sim.runAll();
            }

            function measure(n) {
                var qubits = {}, instrs = [];
                var x = ap.performParse('π/2');
                //
                for (var i = n; i > 0; i--) {
                    qubits[i] = QubitIO.Out;
                    instrs.push(new pattern.Measurement(i, x, [], []))
                }
                for (i = n; i > 0; i--) {
                    instrs.push(new pattern.Prepare(i))
                }
                return new pattern.Pattern(instrs, qubits);
            }
            function randomMeasure(n)
            {
                var pat = measure(n);
                var bins = {};
                for (var j = 0; j < 1000; j++) {
                    sim.begin(pat, {}, {}, null);
                    sim.runAll();
                    if(bins[sim.signal] == undefined)
                        bins[sim.signal] = 1;
                    else
                        bins[sim.signal]++;
                }
                console.log(bins);
            }



            //var gflowResult = flowAnalyser.gflow(qubits, adj);
            function analyseFlow()
            {
                var qubits = predefinedOgs.controlledUGraph[1];
                var adj = predefinedOgs.controlledUGraph[0];
                var result = fa.gflow(qubits, adj);
                console.log(result[0]);
                console.log(result[1]);
                console.log(result[2]);


                /*var suite9 = new Benchmark.Suite;
                suite9.add('flow', function () {
                   fa.gflow(qubits, adj);
                })
                .on('cycle', function (event) {
                    console.log(String(event.target));
                })
                .on('complete', function () {
                    console.log('Fastest is ' + this.filter('fastest').pluck('name'));
                    console.log('stdev:' + this[0].stats.deviation + '\n');
                    console.log('');
                })
                .run({ 'async': true });*/
            }

            function simulationTime()
            {
                var suite10 = new Benchmark.Suite;
                var pat = predefinedPatterns.teleportation;
                suite10.add('simtime', function () {
                    sim.begin(pat, {}, {1: vf.zero()},  null);
                    sim.runAll();
                 })
                 .on('cycle', function (event) {
                 console.log(String(event.target));
                 })
                 .on('complete', function () {
                 console.log('Fastest is ' + this.filter('fastest').pluck('name'));
                 console.log('stdev:' + this[0].stats.deviation + '\n');
                 console.log('');
                 })
                 .run({ 'async': true });
            }



            return {
                standardFormPerformance: standardFormPerformance
            }


        }]);