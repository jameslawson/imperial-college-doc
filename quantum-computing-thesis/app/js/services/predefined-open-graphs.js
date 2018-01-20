'use strict';


angular.module('mbqc.services.predefined-open-graphs', [])
    .factory('predefinedOpenGraphs', ['QubitIO',
        function (qio)
        {

           return {
                sevenQubitExample: [
                    {
                        1: ['2', '3'],
                        2: ['1', '4'],
                        3: ['1', '5', '6'],
                        4: ['2', '6', '7'],
                        5: ['3'],
                        6: ['3', '4'],
                        7: ['4']
                    },
                    {
                        1: qio.In,
                        2: qio.In,
                        3: qio.Neither,
                        4: qio.Neither,
                        5: qio.Out,
                        6: qio.Out,
                        7: qio.Out
                    }
                ],
                nineQubitExample: [
                    {
                        1: ['4'],
                        2: ['4', '5'],
                        3: ['5', '6'],
                        4: ['1', '2', '7'],
                        5: ['2', '3', '8'],
                        6: ['3', '9'],
                        7: ['4'],
                        8: ['5'],
                        9: ['6']
                    },
                    {
                        1: qio.In,
                        2: qio.In,
                        3: qio.In,
                        4: qio.Neither,
                        5: qio.Neither,
                        6: qio.Neither,
                        7: qio.Out,
                        8: qio.Out,
                        9: qio.Out
                    }
                ],
                gflowNoFlowExample: [
                    {
                        1: ['6', '4'],
                        2: ['4', '5', '6'],
                        3: ['5', '6'],
                        4: ['1', '2'],
                        5: ['2', '3'],
                        6: ['3', '1', '2']
                    },
                    {
                        1: qio.In,
                        2: qio.In,
                        3: qio.In,
                        4: qio.Out,
                        5: qio.Out,
                        6: qio.Out
                    }
                ],
                gflowNoFlowExample2: [
                    {
                        1: ['4', '5'],
                        2: ['4', '5', '6'],
                        3: ['4', '6'],
                        4: ['1', '2', '3'],
                        5: ['1', '2'],
                        6: ['2', '3']
                    },
                    {
                        1: qio.In,
                        2: qio.In,
                        3: qio.In,
                        4: qio.Out,
                        5: qio.Out,
                        6: qio.Out
                    }
                ],
                gflowNoFlowExample3: [
                   {
                       1: ['4', '5', '6'],
                       2: ['3', '4', '5', '6'],
                       3: ['2', '4'],
                       4: ['1', '2', '3', '5'],
                       5: ['1', '2', '4'],
                       6: ['1', '2']
                   },
                   {
                       1: qio.In,
                       2: qio.In,
                       3: qio.Neither,
                       4: qio.Neither,
                       5: qio.Out,
                       6: qio.Out
                   }
               ],
                gflowExample: [
                    {
                        1: ['2'],
                        2: ['1', '3'],
                        3: ['2', '4'],
                        4: ['3', '5'],
                        5: ['4']
                    },
                    {
                        1: qio.In,
                        2: qio.Neither,
                        3: qio.Out,
                        4: qio.In,
                        5: qio.Out
                    }
                ],
                threeChain: [
                   {
                       1: ['2'],
                       2: ['1', '3'],
                       3: ['2']
                   },
                   {
                       1: qio.In,
                       2: qio.Neither,
                       3: qio.Out
                   }
               ],
               noFlowSimple: [
                   {
                       1: ['3'],
                       2: ['3'],
                       3: ['1','2']
                   },
                   {
                       1: qio.In,
                       2: qio.Neither,
                       3: qio.Out
                   }
               ],
               controlledUGraph: [
                   {
                       a: ['b'],
                       b: ['a','c','A'],
                       c: ['b','d'],
                       d: ['c','e'],
                       e: ['d','f'],
                       f: ['e','g','A'],
                       g: ['f','h'],
                       h: ['g','i'],
                       i: ['h','j'],
                       j: ['i','k'],
                       k: ['j'],
                       A: ['b','f','B'],
                       B: ['A','C'],
                       C: ['B']
                   },
                   {
                       a: qio.In,
                       b: qio.Neither,
                       c: qio.Neither,
                       d: qio.Neither,
                       e: qio.Neither,
                       f: qio.Neither,
                       g: qio.Neither,
                       h: qio.Neither,
                       i: qio.Neither,
                       j: qio.Neither,
                       k: qio.Out,
                       A: qio.In,
                       B: qio.Neither,
                       C: qio.Out
                   }
               ]
            };
        }
    ]);