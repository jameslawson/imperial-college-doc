angular.module('mbqc.services.angle-parser', [])
    .factory('angleParser', ['pattern', 'QubitIO', 'expressionTree',
        function (pattern, QubitIO, et)
    {

        function performParse(str)
        {
            var charIndex = 0;
            return parsePlusMinus();

            function parsePlusMinus()
            {
                var l = parseMultiplyDivide(), r;
                var node = l;
                var char = str[charIndex];
                while (char == '+' || char == '-') {
                    charIndex++;
                    r = parseMultiplyDivide();
                    node = (char == '+') ? new et.AdditionNode().left(l).right(r)
                                         : new et.MinusNode().left(l).right(r);
                    char = str[charIndex];
                    l = node;
                }
                return node;
            }

            function parseMultiplyDivide()
            {
                var l = parseUnaryPlusMinus(), r;
                var node = l;
                var char = str[charIndex];
                while (char == '*' || char == '/') {
                    charIndex++;
                    r = parseUnaryPlusMinus();
                    node = (char == '*') ? new et.MultiplicationNode().left(l).right(r)
                        : new et.DivisionNode().left(l).right(r);
                    char = str[charIndex];
                    l = node;
                }
                return node;
            }

            function parseUnaryPlusMinus()
            {
                var char = str[charIndex], node;
                if (char == '-') {
                    charIndex++;
                    var l = parseParenthesis();
                    node = new et.MinusNode().left(l);
                } else {
                    node = parseParenthesis();
                }
                return node;
            }

            function parseParenthesis()
            {
                var char = str[charIndex], node;
                if (char == '(') {
                    charIndex++;
                    node = parsePlusMinus();
                } else {
                    node = parseAtom();
                }
                return node;
            }

            // Handle atomic bits, numbers/angle identifiers
            function parseAtom()
            {
                var char = str.charAt(charIndex), node;
                if (isNumber(char)) {
                    node = new et.NumberNode(parseNumberToken());
                } else if (isIdentifier(char)) {
                    charIndex++;
                    node = new et.IdentifierNode(char);
                }
                return node;
            }

            function isNumber(c) {
                return /^\d+$/.test(c);
            }

            function isIdentifier(c) {
                return new RegExp("[a-z αβγπ]").test(c);
            }

            function parseNumberToken() {
                var result = '';
                while (!atEnd() && isNumber(str.charAt(charIndex))) {
                     result += str.charAt(charIndex++);
                }
                return result;
            }

            function atEnd() {return charIndex == str.length}
        }


        return {
            performParse: performParse
        }



    }]);