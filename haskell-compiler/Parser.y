{
module Main where
import TypeDefinitions
import SemanticAnalyser
import Scanner
import CodeGenerator
import System
import System.IO  
import System.Directory 
import Control.Monad

}

{- Tokens generated using Alex are passed here to the parser -}

%name malice
%tokentype { Token }
%error { parseError }

%token
    integer_literal          { TokenIntegerLiteral _ $$ }
    char_literal             { TokenCharLiteral _ $$ }
    sentence_literal         { TokenSentenceLiteral _ $$ }
    ident                    { TokenIdentifier _ $$ }
    ending_sentence          { TokenEndSentence _ }
    lookingGlass             { TokenLookingGlass _ }
    changed                  { TokenChanged _ }
    leftParen                { TokenLeftParen _ }
    rightParen               { TokenRightParen _ }
    ate                      { TokenAte _ }
    drank                    { TokenDrank _ }
    said                     { TokenSaid _ }
    was                      { TokenWas _ }
    what                     { TokenWhat _ }
    a                        { TokenA _ }
    number                   { TokenNumber _ }
    letter                   { TokenLetter _ }
    spoke                    { TokenSpoke _ }
    sentence                 { TokenSentence _ }
    had                      { TokenHad _ }
    piece                    { TokenPiece _ }
    spider                   { TokenSpider _ }
    became                   { TokenBecame _ }
    the                      { TokenThe _ }
    room                     { TokenRoom _ }
    contained                { TokenContained _ }
    aliceFound               { TokenAliceFound _ }
    if_begin                 { TokenIfBegin _ }
    so                       { TokenSo _ }
    or                       { TokenOr _ }
    maybe                    { TokenMaybe _ }
    alice                    { TokenAlice _ }
    unsure                   { TokenUnsure _ }
    which                    { TokenWhich _ }
    plusop                   { TokenPlus _ }
    minusop                  { TokenMinus _ }
    timesop                  { TokenMult _ }
    divideop                 { TokenDivide _ }
    moduloop                 { TokenModulo _ }
    bitandop                 { TokenBitAnd _ }
    bitorop                  { TokenBitOr _ }
    bitxorop                 { TokenBitXor _ }
    bitnotop                 { TokenBitNot _ }
    logandop                 { TokenLogAnd _ }
    logorop                  { TokenLogOr _ }
    ltop                     { TokenLessThan _ }
    lteop                    { TokenLessThanEq _ }
    gtop                     { TokenGreaterThan _ }
    gteop                    { TokenGreaterThanEq _ }
    lognotop                 { TokenLogNot _ }
    eqop                     { TokenEquals _ }
    neqop                    { TokenNotEquals _ }
    eventually               { TokenEventually _ }
    because                  { TokenBecause _ }
    enough                   { TokenEnough _ }
    times                    { TokenTimes _ }
    apostrophe_s             { TokenApostropheS _ }
    questionmark             { TokenQMark _}
    thought                  { TokenThought _ }


{- Declare these operations as left associative -}
{- precedence is defined here. Lowest at top of list, highest at bottom -}
%left logorop                    {- Logical OR -}
%left logandop                   {- Logical AND -}
%left bitorop                    {- Bitwise inclusive OR -}
%left bitxorop                   {- Bitwise exclusive OR (XOR) -}
%left bitandop                   {- Bitwise AND -}
%left eqop neqop                 {- Relational is equal to/is not equal to -}
%left ltop lteop gtop gteop      {- Relational <, <=, >, >= -}
%left plusop minusop             {- Addition, subtraction -}
%left timesop divideop moduloop  {- Multiplication, division, modulus -}
%left lognotop bitnotop          {- Logical negation, bitwise complement -}
%left NEG                        {- Unary Minus -}



%%
{- These rules are used to generate an abstract syntax tree in haskell -}
prog :                   { Program [] [] }
       | stmts           { Program $1 [] }
       | rooms           { Program [] $1 }
       | stmts rooms     { Program $1 $2 }

stmts : stmt                   { [$1] }
      | stmt stmts             { $1 : $2 }

end_sentence : ending_sentence {} 
             | questionmark    {}

stmt : stmt1 end_sentence          { $1 }
     | what was ident questionmark { InputNumber $3 }

output : spoke { }
       | said alice { } 


stmt1 : sentence_literal thought alice   { Comment $1}
      | ident was a number               { DeclareNumber $1 }
      | ident was a letter               { DeclareLetter $1 }
      | ident was a sentence             { DeclareSentence $1 }
      | ident had integer_literal number { DeclareNumberArray $1 $3 }
      | ident had integer_literal letter { DeclareLetterArray $1 $3 }
      | ident had integer_literal sentence { DeclareSentenceArray $1 $3 }
      | ident became ident               { AssignVarToVar $1 $3 }
      | ident became mexp2               { AssignNumber $1 $3 }
      | ident became charinbracks        { AssignLetter $1 $3 }
      | ident became sentence_literal    { AssignSentence $1 $3 }
      | ident became function_call       { AssignRoomCall $1 $3 }
      | ident apostrophe_s integer_literal piece became mexp2 { AssignMExpToArray $1 $3 $6 }
      | ident apostrophe_s integer_literal piece became ident { AssignVarToArray $1 $3 $6 }
      | ident apostrophe_s integer_literal piece became charinbracks { AssignLetterToArray $1 $3 $6 }
      | ident apostrophe_s integer_literal piece became sentence_literal { AssignSentenceToArray $1 $3 $6 }
      | ident ate                        { VarAte $1 }
      | ident drank                      { VarDrank $1 } 
      | conditional                      { $1 }
      | loop                             { $1 } 
      | charinbracks output              { LetterSpoke $1 }
      | sentence_literal output          { SentenceSpoke $1 }
      | function_call output             { RoomCallSpoke $1 }
      | ident output                     { VarSpoke $1 }
      | mexp2 output                     { MExpSpoke $1 }
      | aliceFound ident                 { AliceFoundVar $2 }
      | aliceFound function_call         { AliceFoundRoomCall $2 }
      | aliceFound mexp2                 { AliceFoundMExp $2 }
      | aliceFound charinbracks          { AliceFoundLetter $2 }
      | aliceFound sentence_literal      { AliceFoundSentence $2 }
      


conditional : startcondition endcondition { $1 }

startcondition : if_begin mexp1 so stmts  { Conditional $2 $4 [] }
     | if_begin mexp1 so stmts or stmts   { Conditional $2 $4 $6 }
     | if_begin mexp1 so stmts subconditions  { Conditional $2 $4 [$5] }

subconditions :  or maybe mexp1 so stmts or maybe mexp1 so stmts subconditions { Conditional $3 $5 [Conditional $8 $10 [$11]] }
    | or maybe mexp1 so stmts or maybe mexp1 so stmts or stmts  { Conditional $3 $5 [Conditional $8 $10 $12] }
    | or maybe mexp1 so stmts or maybe mexp1 so stmts { Conditional $3 $5 [Conditional $8 $10 []]}
    | or maybe mexp1 so stmts or stmts { Conditional $3 $5 $7 }
    | or maybe mexp1 so stmts { Conditional $3 $5 [] }

endcondition : alice was unsure which { }
             | alice was unsure { }

loop : eventually leftParen mexp1 rightParen because enough times { Eventually $3 [] }
     | eventually leftParen mexp1 rightParen because stmts enough times { Eventually $3 $6 }


rooms : room1                   { [$1] }
      | room1 rooms             { $1 : $2 }

room1 : the room ident leftParen params rightParen contained a number stmts   {Room $3 $5 $10 NumberType 0 }
     | the room ident leftParen params rightParen contained a letter stmts   {Room $3 $5 $10 LetterType 0 }
     | the room ident leftParen params rightParen contained a sentence stmts {Room $3 $5 $10 SentenceType 0 }
     | the room ident leftParen rightParen contained a number stmts   {Room $3 [] $9 NumberType 0 }
     | the room ident leftParen rightParen contained a letter stmts   {Room $3 [] $9 LetterType 0 }
     | the room ident leftParen rightParen contained a sentence stmts {Room $3 [] $9 SentenceType 0 }

lookingGlass1 : the lookingGlass ident changed a number stmts {LookingGlass $3 $7 NumberType 0 }
     | the lookingGlass ident changed a letter stmts {LookingGlass $3 $7 LetterType 0 }
     | the lookingGlass ident changed a sentence stmts {LookingGlass $3 $7 SentenceType 0 }


params :  param           { [$1] }
       |  param end_sentence params    { $1 : $3 }

param : number ident      { (NumberType, $2) }
      | letter ident      { (LetterType, $2) }
      | sentence ident    { (SentenceType, $2) }
      | spider ident number      { (NumberArrayType 0, $2) }
      | spider ident letter      { (LetterArrayType 0, $2) }
      | spider ident sentence    { (SentenceArrayType 0, $2) }
      

mexp2 : mexp1 plusop mexp1          { Plus $1 $3 }
     |  mexp1 minusop mexp1         { Minus $1 $3 }
     |  mexp1 timesop mexp1         { Mult $1 $3 }
     |  mexp1 divideop mexp1        { Div $1 $3 }
     |  mexp1 moduloop mexp1        { Mod $1 $3 }
     |  mexp1 bitandop mexp1        { BitAnd $1 $3 }
     |  mexp1 bitorop mexp1         { BitOr $1 $3 }
     |  mexp1 bitxorop mexp1        { BitXor $1 $3 }
     |  bitnotop mexp1              { BitNot $2 }
     |  minusop mexp1 %prec NEG     { Negate $2 }
     |  mexp1 logandop mexp1        { LogAnd $1 $3 }
     |  mexp1 logorop mexp1         { LogOr $1 $3 }
     |  mexp1 ltop mexp1            { LessThan $1 $3 }
     |  mexp1 lteop mexp1           { LessThanEq $1 $3 }
     |  mexp1 gtop mexp1            { GreaterThan $1 $3 }
     |  mexp1 gteop mexp1           { GreaterThanEq $1 $3 }
     |  lognotop mexp1              { LogNot $2 }
     |  mexp1 eqop mexp1            { Equals $1 $3 }
     |  mexp1 neqop mexp1           { NotEquals $1 $3 }
     |  leftParen mexp1 rightParen  { $2 }
     |  integer_literal             { IntLit $1 }


function_call : ident leftParen rightParen            { RoomCall $1 [] }
              | ident leftParen callparams rightParen { RoomCall $1 $3 }

callparams : callparam                           { [$1] }
           |  callparam end_sentence callparams   { $1 : $3 }

callparam : mexp1                { MExpArg $1 }
          | char_literal         { LetterArg $1 }
          | sentence_literal     { SentenceArg $1 }


mexp1 : mexp2                       { $1 }
      | ident                       { MExpVar $1 }
      | function_call               { MExpRoomCall $1 }



charinbracks : char_literal                { $1 }
     | leftParen charinbracks rightParen   { $2 }



{

-- If the parser comes across a parser error, this function is called with the last token that was scanned in
parseError :: [Token] -> a
parseError tokenList = error ("\n----------------\n"
                               ++ "Oh No! You started writing utter nonsense"
                               ++ " in paragraph " ++ show(getLineNum(pos)) 
                               ++ ", at letter " ++ show(getColumnNum(pos))
                               ++ "\n----------------")
                       where errorToken = head(tokenList)
                             pos = tokenPosn(errorToken)


-- Prints and formats the errors found
printErrors [] = putStr("----------------\n");
printErrors (error:errors) = do
  putStrLn ("----------------\nOh No! " ++ show error)
  printErrors errors

-- Main function: Gets the source file using the program's arguments, 
-- parses the file into a haskell string, calls doParse to generate a tree and 
-- errors, writes the generated code to a new assembly file, calls nasm to compile
-- the nasm files into object code, and finally calls ld to link the files and 
-- generate an executable.
-- The last statement performs cleanup.
main :: IO ExitCode
main = do 
  args <- getArgs
  let inputfname = args !! 0
  let programFileName = (reverse . drop 1 . dropWhile ( /= '.') . reverse) inputfname
  inStr <- readFile inputfname
  let (mainRoomStmts, parsedRooms) = (stmts,rs)
              where (Program stmts rs) = malice (alexScanTokens inStr) 
  let mainRoom = (Room "main" [] mainRoomStmts NumberType 0)
  let allRooms = mainRoom : parsedRooms  
  let gScope = createGlobalScope (reverse allRooms)
  let (rAllRooms, roomErrs) = semanticAnalysis allRooms gScope ([], [])
  --putStrLn("Parsed Program:\n" ++ show parsetree ++ "\n")
  --putStrLn("Parsed Rooms:\n" ++ show parserooms ++ "\n")
  putStrLn("Rewritten Rooms:\n" ++ show rAllRooms ++ "\n")
  system "echo Done."
  if (not (null roomErrs))
    then do 
		printErrors roomErrs
		putStrLn "Oops! You've got errors. Compile failed."
		exitFailure
    else do 
		let assemblyString = codeGeneration rAllRooms 
		writeFile "assembly/generatedCode.asm" assemblyString
		tryNasmGeneratedCode <- system "nasm -f elf64 -g -F stabs assembly/generatedCode.asm"
		tryNasmPrintingfns <- system "nasm -f elf64 -g -F stabs assembly/printingfns.asm"
		system $ "gcc -o " ++ programFileName ++ " assembly/generatedCode.o assembly/printingfns.o"
		--system "rm -f assembly/generatedCode.asm assembly/generatedCode.o assembly/printingfns.o "

}
