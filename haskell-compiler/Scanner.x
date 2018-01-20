{
-- This file produces a scanner using Alex. It defines the Alice syntax in terms
-- of regular expressions and maps them into Haskell data types.
module Scanner where
}


%wrapper "posn"

$digit = 0-9      -- digits	
$alpha = [a-zA-Z] -- alphabetic characters
$tabwhite = $white
@identold      =  $alpha [ $alpha $digit \_ ]*
@ident = \_* [a-zA-Z]+ [ a-zA-Z 0-9 \_]*
@endSentence =  "and" | "then" | "but" | "." | "," | "too."
@char     = \' $printable \'
@beginIF = "either" | "perhaps"
@sentenceLiteral = \" $printable* \"
@alicefound = "Alice" $white+ "found"  


tokens :-

  $white+			                              ;
  @endSentence                              { \p s -> TokenEndSentence p }
  "spoke"                                   { \p s -> TokenSpoke p }
  "ate"                                     { \p s -> TokenAte p }
  "drank"                                   { \p s -> TokenDrank p }
  "was"                                     { \p s -> TokenWas p }
  "what"                                    { \p s -> TokenWhat p }
  "a"                                       { \p s -> TokenA p }
  "number"                                  { \p s -> TokenNumber p }
  "letter"                                  { \p s -> TokenLetter p }
  "sentence"                                { \p s -> TokenSentence p }
  "had"                                     { \p s -> TokenHad p }
  "piece"                                   { \p s -> TokenPiece p }
  "spider"                                  { \p s -> TokenSpider p }
  "became"                                  { \p s -> TokenBecame p }
  "The"                                     { \p s -> TokenThe p }
  "room"                                    { \p s -> TokenRoom p }
  "contained"                               { \p s -> TokenContained p }
  "Looking-Glass"                           { \p s -> TokenLookingGlass p }
  "changed"                                 { \p s -> TokenChanged p }
  @alicefound                               { \p s -> TokenAliceFound p }
  @beginIF                                  { \p s -> TokenIfBegin p }
  "so"                                      { \p s -> TokenSo p }
  "or"                                      { \p s -> TokenOr p }
  "maybe"                                   { \p s -> TokenMaybe p }
  "said"                                    { \p s -> TokenSaid p }
  "Alice"                                   { \p s -> TokenAlice p }
  "unsure"                                  { \p s -> TokenUnsure p }
  "which"                                   { \p s -> TokenWhich p }
  "eventually"                              { \p s -> TokenEventually p }
  "because"                                 { \p s -> TokenBecause p }
  "enough"                                  { \p s -> TokenEnough p }
  "times"                                   { \p s -> TokenTimes p }
  "thought"                                 { \p s -> TokenThought p} 
  @char                                     { \p s -> TokenCharLiteral p (read s) }
  $digit+                                   { \p s -> TokenIntegerLiteral p (read s) }
  @sentenceLiteral                          { \p s -> TokenSentenceLiteral p (read s) }
  @ident                                    { \p s -> TokenIdentifier p s}
  "("                                       { \p s -> TokenLeftParen p }
  ")"                                       { \p s -> TokenRightParen p }
  "+"                                       { \p s -> TokenPlus p }
  "-"                                       { \p s -> TokenMinus p }
  "*"                                       { \p s -> TokenMult p }
  "/"                                       { \p s -> TokenDivide p }
  "%"                                       { \p s -> TokenModulo p }
  "&"                                       { \p s -> TokenBitAnd p }
  "|"                                       { \p s -> TokenBitOr p }
  "^"                                       { \p s -> TokenBitXor p }
  "~"                                       { \p s -> TokenBitNot p }
  "&&"                                      { \p s -> TokenLogAnd p }
  "||"                                      { \p s -> TokenLogOr p }
  "<"                                       { \p s -> TokenLessThan p }
  "<="                                      { \p s -> TokenLessThanEq p }
  ">"                                       { \p s -> TokenGreaterThan p }
  ">="                                      { \p s -> TokenGreaterThanEq p }
  "=="                                      { \p s -> TokenEquals p }
  "!="                                      { \p s -> TokenNotEquals p }
  "!"                                       { \p s -> TokenLogNot p }
  "'s"                                      { \p s -> TokenApostropheS p }
  "?"                                       { \p s -> TokenQMark p }
  
  


{

data Token =
    TokenEndSentence AlexPosn |
    TokenSpoke AlexPosn |
    TokenAte AlexPosn |
    TokenDrank AlexPosn |
    TokenWas AlexPosn |
    TokenWhat AlexPosn |
    TokenA AlexPosn |
    TokenNumber AlexPosn |
    TokenLetter AlexPosn |
    TokenSentence AlexPosn |
    TokenHad AlexPosn |
    TokenPiece AlexPosn |
    TokenBecame AlexPosn |
    TokenIntegerLiteral AlexPosn Int  |
    TokenIdentifier AlexPosn String |
    TokenCharLiteral AlexPosn Char |
    TokenSentenceLiteral AlexPosn String |
    TokenLeftParen AlexPosn |
    TokenRightParen AlexPosn |
    TokenPlus AlexPosn |
    TokenMinus AlexPosn |
    TokenMult AlexPosn |
    TokenDivide AlexPosn |
    TokenModulo AlexPosn |
    TokenBitAnd AlexPosn |
    TokenBitOr AlexPosn |
    TokenBitXor AlexPosn |
    TokenBitNot AlexPosn |
    TokenLogAnd AlexPosn |
    TokenLogOr AlexPosn |
    TokenLessThan AlexPosn |
    TokenLessThanEq AlexPosn |
    TokenGreaterThan AlexPosn |
    TokenGreaterThanEq AlexPosn |
    TokenEquals AlexPosn |
    TokenNotEquals AlexPosn |
    TokenLogNot AlexPosn |
    TokenIfBegin AlexPosn |
    TokenOr AlexPosn |
    TokenMaybe AlexPosn |
    TokenAlice AlexPosn |
    TokenUnsure AlexPosn |
    TokenWhich AlexPosn |
    TokenSo AlexPosn |
    TokenEventually AlexPosn |
    TokenBecause AlexPosn |
    TokenEnough AlexPosn |
    TokenTimes AlexPosn |
    TokenSaid AlexPosn |
    TokenApostropheS AlexPosn |
    TokenThe AlexPosn |
    TokenRoom AlexPosn |
    TokenContained AlexPosn |
    TokenLookingGlass AlexPosn |
    TokenChanged AlexPosn |
    TokenAliceFound AlexPosn |
    TokenSpider AlexPosn |
    TokenQMark AlexPosn |
    TokenThought AlexPosn
    deriving (Eq,Show)


tokenPosn (TokenEndSentence p) = p
tokenPosn (TokenSpoke p) = p
tokenPosn (TokenAte p) = p
tokenPosn (TokenDrank p) = p
tokenPosn (TokenWas p) = p
tokenPosn (TokenWhat p) = p
tokenPosn (TokenA p) = p
tokenPosn (TokenNumber p) = p
tokenPosn (TokenLetter p) = p
tokenPosn (TokenSentence p) = p
tokenPosn (TokenBecame p) = p
tokenPosn (TokenHad p) = p
tokenPosn (TokenPiece p) = p
tokenPosn (TokenIntegerLiteral p i) = p
tokenPosn (TokenIdentifier p str) = p
tokenPosn (TokenCharLiteral p c) = p
tokenPosn (TokenSentenceLiteral p c) = p
tokenPosn (TokenLeftParen p) = p
tokenPosn (TokenRightParen p) = p
tokenPosn (TokenPlus p) = p
tokenPosn (TokenMinus p) = p
tokenPosn (TokenMult p) = p
tokenPosn (TokenDivide p) = p
tokenPosn (TokenModulo p) = p
tokenPosn (TokenBitAnd p) = p
tokenPosn (TokenBitOr p) = p
tokenPosn (TokenBitXor p) = p
tokenPosn (TokenBitNot p) = p
tokenPosn (TokenLogAnd p) = p
tokenPosn (TokenLogOr p) = p
tokenPosn (TokenLessThan p) = p
tokenPosn (TokenLessThanEq p) = p
tokenPosn (TokenGreaterThan p) = p
tokenPosn (TokenGreaterThanEq p) = p
tokenPosn (TokenEquals p) = p
tokenPosn (TokenNotEquals p) = p
tokenPosn (TokenLogNot p) = p
tokenPosn (TokenIfBegin p) = p
tokenPosn (TokenSo p) = p
tokenPosn (TokenOr p) = p
tokenPosn (TokenMaybe p) = p
tokenPosn (TokenAlice p) = p
tokenPosn (TokenUnsure p) = p
tokenPosn (TokenWhich p) = p
tokenPosn (TokenEventually p) = p
tokenPosn (TokenBecause p) = p
tokenPosn (TokenEnough p) = p
tokenPosn (TokenTimes p) = p
tokenPosn (TokenSaid p) = p
tokenPosn (TokenApostropheS p) = p
tokenPosn (TokenThe p) = p
tokenPosn (TokenRoom p) = p
tokenPosn (TokenLookingGlass p) = p
tokenPosn (TokenContained p) = p
tokenPosn (TokenChanged p) = p
tokenPosn (TokenAliceFound p) = p
tokenPosn (TokenSpider p) = p
tokenPosn (TokenQMark p) = p
tokenPosn (TokenThought p) = p

getLineNum :: AlexPosn -> Int
getLineNum (AlexPn offset lineNum colNum) = lineNum 

getColumnNum :: AlexPosn -> Int
getColumnNum (AlexPn offset lineNum colNum) = colNum

getAbsOffset :: AlexPosn -> Int
getAbsOffset (AlexPn offset lineNum colNum) = offset

alexScanTokens2 str = go (alexStartPos,'\n',str)
  where go inp@(pos,_,str) =
          case alexScan inp 0 of
                AlexEOF -> []
                AlexError _ -> error ("OMG! You started writing utter nonsense in paragraph " ++ show (getLineNum(pos)) ++ ", at letter " ++ show (getColumnNum(pos)))
                AlexSkip  inp' len     -> go inp'
                AlexToken inp' len act -> act pos (take len str) : go inp'


}

