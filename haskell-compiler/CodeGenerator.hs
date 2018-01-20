module CodeGenerator where
import TypeDefinitions
import Data.List


-- Common strings for all assembly code generated
globals = "extern output_int\nextern output_char\nextern outfunc\nextern os_return\nextern readnumber\n"
codeHeader = "segment .text\nglobal main\nmain:\ncall f0main\n"
dataHeader = "segment .data\n %macro  LoadRegWithStrAddr 2+\n        jmp     %%endstr\n  %%str:        dq      %2\n  %%endstr:\n        mov     %1, %%str\n\n%endmacro\n\n%macro  LoadRegWithArray 2+\n\n        jmp     %%endarr\n  %%arr:        dq      %2\n  %%endarr:\n        mov     %1, %%arr\n\n%endmacro\n"
osreturn = "call os_return\n"

-- Produce assembly file contents, given a list of statements


codeGeneration :: [RoomDef] -> String
codeGeneration rooms
    = globals ++ dataHeader ++codeHeader ++ osreturn ++ mainSectionStr
   where mainSectionStr = showInstructions (transRooms rooms)

transRooms :: [RoomDef] -> [IntelInstruction]
transRooms [] = []
transRooms ((Room id ps stmts r numLocal):rooms)
   = roomInstrs ++ (transRooms rooms)  
   where (stmtInstrs, datasectiontable) = transStatement stmts ([], [])
         roomInstrs = [LABEL id] ++ [PUSH (RegOprnd RBP)]
                          ++ [MOV (RegOprnd RBP) (RegOprnd RSP)] 
                          ++ [SUB (RegOprnd RSP) (ImmIntOprnd (8 * numLocal +8))] 
                          ++ stmtInstrs 
                          ++ [RETURN]


showInstructions :: [IntelInstruction] -> String
showInstructions [] = []
showInstructions (i:is) = (show(i) ++ "\n") ++ showInstructions is



-- Translate statements of a program into instructions (IntelInstruction)

transStatement :: [Statement] -> ([IntelInstruction], DataSectionTable) -> ([IntelInstruction], DataSectionTable)
transStatement [] (instrs, table) = (instrs, table)
transStatement ((Comment str):stmts) (instrs, table) = transStatement stmts (instrs, table)
transStatement ((DeclareNumber id):stmts) (instrs, table) = transStatement stmts (instrs, table)
transStatement ((DeclareLetter id):stmts) (instrs, table) = transStatement stmts (instrs, table)
transStatement ((DeclareSentence id):stmts) (instrs, table) = transStatement stmts (instrs, table)



transStatement ((DeclareNumberArray id size):stmts) (instrs, table)
   = transStatement stmts (newinstrs, table)
   where newinstrs = instrs ++ [STARTARRAY id "0" size] 
         
transStatement ((DeclareLetterArray id size):stmts) (instrs, table)
   = transStatement stmts (newinstrs, table)
   where newinstrs = instrs ++ [STARTARRAY id "' '" size] 


transStatement ((DeclareSentenceArray id size):stmts) (instrs, table)
   = transStatement stmts (newinstrs, table)
   where newinstrs = instrs ++ [STARTARRAY id "0" size]



transStatement ((AssignMExpToArray id index mexp):stmts) (instrs, table)
   = transStatement stmts (newinstrs, table) --(RegOprnd topReg) contains result of mexp
   where newinstrs = instrs ++ (transExpression mexp allRegs) ++ [SETINDEX  id (RegOprnd topReg) index]
--AssignVarToArray
--AssignLetterToArray
--AssignSentenceToArray


transStatement ((AssignNumber id mexp):stmts) (instrs, table)
   = transStatement stmts (newinstrs, table)
   where newinstrs = instrs ++ (transExpression mexp allRegs) ++ [MOV (VarLabel id)(RegOprnd topReg)]

transStatement ((AssignLetter id c):stmts) (instrs, table)
   = transStatement stmts (newinstrs, table) 
   where newinstrs = instrs ++ [MOV (VarLabel id)(ImmCharOprnd c)]


transStatement ((AssignSentence id str):stmts) (instrs, table)
   = transStatement stmts (newinstrs, table) 
   where newinstrs = instrs ++ [LOADSTR id str]





transStatement ((AssignVarToVar id1 id2):stmts) (instrs, table)
   = transStatement stmts (newinstrs, table) 
   where newinstrs = instrs ++ [MOV (RegOprnd topReg)(VarLabel id2)] ++ [MOV (VarLabel id1)(RegOprnd topReg)]



transStatement ((AssignRoomCall id1 (RoomCall id2 args)):stmts)  (instrs, table)
   = transStatement stmts (newinstrs, table) 
   where newinstrs = instrs ++ (pushArgs args allRegs) ++ [CALL id2]
                            ++ [MOV (VarLabel id1) (RegOprnd RAX)]
                            ++ [ADD (RegOprnd RSP) (ImmIntOprnd ((length args) * 8))] 



transStatement ((VarAte id):stmts) (instrs, table)
   = transStatement stmts (instrs ++ [INC id], table) 

transStatement ((VarDrank id):stmts) (instrs, table)
   = transStatement stmts (instrs ++ [DEC id], table) 


transStatement ((Conditional mexp stmts1 stmts2):stmts) (instrs, table)
   = transStatement stmts (newInstructions, afterConditionTable) 
   where afterConditionTable = table2 ++ [(falselabelid, LabelType), (endifid, LabelType)]
         falselabelid = "falselabel" ++ (show (length table2)) 
         endifid = "endif" ++ (show (length table2 + 1))
         (stmts1Instructions, table1) = transStatement stmts1 ([], table)
         (stmts2Instructions, table2) = transStatement stmts2 ([], table1)
         newInstructions = instrs ++ (transExpression mexp allRegs) 
                            ++ [CMP (RegOprnd topReg)(ImmIntOprnd 0)]
                            ++ [JE falselabelid]
                            ++ stmts1Instructions
                            ++ [JMP endifid]
                            ++ [LABEL falselabelid]
                            ++ stmts2Instructions
                            ++ [LABEL endifid]


        
transStatement ((Eventually mexp loopStmts):stmts) (instrs, table)
   = transStatement stmts (newInstructions, newtable) 
   where newtable = table1 ++ [(startloopid, LabelType), (endloopid, LabelType)]
         startloopid = "loop" ++ (show (length table1)) 
         endloopid = "endloop" ++ (show (length table1 + 1))
         (loopStmtsInstrs, table1) = transStatement loopStmts ([], table)
         newInstructions = instrs ++  [LABEL startloopid] ++ (transExpression mexp allRegs) 
                            ++ [CMP (RegOprnd topReg)(ImmIntOprnd 0)]
                            ++ [JNE endloopid]
                            ++ loopStmtsInstrs
                            ++ [JMP startloopid]
                            ++ [LABEL endloopid]

transStatement ((InputNumber id):stmts) (instrs, table)
 = transStatement stmts ((instrs ++ [(CALL "readnumber")]++ [MOV (VarLabel id)  (RegOprnd RAX)]), table)


{-----------------------------------------------------}
{-------------------FOUND CODEGEN --------------------}
{-----------------------------------------------------}



transStatement ((AliceFoundMExp mexp):stmts) (instrs, table)
   = transStatement stmts ((instrs ++ (transExpression mexp allRegs) ++ [MOV (RegOprnd RAX) (RegOprnd topReg)] ++ [RETURN]), table)


transStatement ((AliceFoundVar id):stmts) (instrs, table)
  =  transStatement stmts ((instrs ++ [MOV (RegOprnd RAX) (VarLabel id)] ++ [RETURN]), table)
  

transStatement ((AliceFoundLetter c):stmts) (instrs, table)
   = transStatement stmts ((instrs ++ [MOV (RegOprnd RAX) (ImmCharOprnd c)] ++ [RETURN]), table)
   
transStatement ((AliceFoundSentence str):stmts) (instrs, table)
   = transStatement stmts ((instrs ++ [PRINTSTR str] ++ [RETURN]), table)
   

transStatement ((AliceFoundRoomCall (RoomCall id args):stmts)) (instrs, table)
   = transStatement stmts (newinstrs, table)
   where newinstrs = instrs ++ (pushArgs args allRegs) ++ [CALL id] ++ [ADD (RegOprnd RSP) (ImmIntOprnd ((length args) * 8))] ++ [RETURN]


{-----------------------------------------------------}
{-------------------SPOKE CODEGEN --------------------}
{-----------------------------------------------------}






{-

transStatement ((VarSpoke id):stmts) (instrs, table)
   = transStatement stmts ((instrs ++ [PRINTNUMVAR id]), table)

transStatement ((RoomCallSpoke (RoomCall id args)):stmts) (instrs, table)
    = transStatement stmts (newinstrsNum, table)
   where newinstrsNum = instrs ++ (pushArgs args allRegs) ++ [CALL id] ++ [MOV (RegOprnd topReg) (RegOprnd RAX)]  
                               ++ [ADD (RegOprnd RSP) (ImmIntOprnd ((length args) * 8))] ++ [PRINTMEXP]
-}




transStatement ((MExpSpoke mexp):stmts) (instrs, table)
   = transStatement stmts (newinstrs, table) 
   where newinstrs = instrs ++ transExpression mexp allRegs ++ [PRINTMEXP]

transStatement ((LetterSpoke c):stmts) (instrs, table)
   = transStatement stmts (instrs ++ [PRINTLET c], table) 

transStatement ((SentenceSpoke id):stmts) (instrs, table)
   = transStatement stmts (instrs ++ [PRINTSTR id], table)

transStatement ((NumberVarSpoke id):stmts) (instrs, table)
   = transStatement stmts (instrs ++ [PRINTNUMVAR id], table) 

transStatement ((LetterVarSpoke id):stmts) (instrs, table)
   = transStatement stmts (instrs ++ [PRINTLETVAR id], table) 

transStatement ((SentenceVarSpoke id):stmts) (instrs, table)
   = transStatement stmts (instrs ++ [PRINTSENTENCEVAR id], table) 


transStatement ((NumberRoomCallSpoke (RoomCall id args)):stmts) (instrs, table)
   = transStatement stmts (newinstrs, table) 
   where newinstrs = instrs ++ (pushArgs args allRegs) ++ [CALL id] ++ [MOV (RegOprnd topReg) (RegOprnd RAX)]  
                            ++ [ADD (RegOprnd RSP) (ImmIntOprnd ((length args) * 8))] ++ [PRINTMEXP]

transStatement ((LetterRoomCallSpoke (RoomCall id args)):stmts) (instrs, table)
   = transStatement stmts (newinstrs, table) 
   where newinstrs = instrs ++ (pushArgs args allRegs) ++ [CALL id] ++ [MOV (RegOprnd topReg) (RegOprnd RAX)]  
                            ++ [ADD (RegOprnd RSP) (ImmIntOprnd ((length args) * 8))] ++ [PRINTLETREG]


transStatement ((SentenceRoomCallSpoke (RoomCall id args)):stmts) (instrs, table)
   = transStatement stmts (newinstrs, table) 
   where newinstrs = instrs ++ (pushArgs args allRegs) ++ [CALL id] ++ [ADD (RegOprnd RSP) (ImmIntOprnd ((length args) * 8))]
                            ++ [PUSH (RegOprnd RAX)] ++ [CALL "outfunc"] ++ [ADD (RegOprnd RSP) (ImmIntOprnd 8)]







{-----------------------------------------------------}
{---------------------FOUND CODEGEN ------------------}
{-----------------------------------------------------}















-------------------------------------------------------------------------------------
---- Translate numerical expressions used in "x became <MEXP>" and "<MEXP> spoke"----
-------------------------------------------------------------------------------------

-- the case where we have only one register left, we must use the stack to store intermediate results

transExpressionStack e1 e2 d instr = (transExpression e2 [d]) ++ [PUSHREG (RegOprnd d)] 
   ++ (transExpression e1 [d])  ++ [instr] ++ [ADD (RegOprnd RSP) (ImmIntOprnd 8)]

divInstrs d r = [MOV (RegOprnd RAX)(RegOprnd r)] ++ [MOV (RegOprnd RBX)(RegOprnd d)] ++ [IDIV (RegOprnd EBX)] ++ [MOV (RegOprnd d)(RegOprnd RAX)]
modInstrs d r = [MOV (RegOprnd RAX)(RegOprnd r)] ++ [MOV (RegOprnd RBX)(RegOprnd d)] ++ [IDIV (RegOprnd EBX)] ++ [MOV (RegOprnd d)(RegOprnd RDX)]


transExpression :: MExp -> [IntelRegister] -> [IntelInstruction] 
transExpression (MExpVar x) (d:rest) = [MOV (RegOprnd d) (VarLabel x)]
transExpression (IntLit x) (d:rest) =  [MOV (RegOprnd d) (ImmIntOprnd x)]
transExpression (Plus e1 e2) [d] = transExpressionStack e1 e2 d (ADD (RegOprnd d) (IndirReg RSP))
transExpression (Minus e1 e2) [d] = transExpressionStack e1 e2 d (SUB (RegOprnd d) (IndirReg RSP))
transExpression (Mult e1 e2) [d] = transExpressionStack e1 e2 d (IMUL (RegOprnd d) (IndirReg RSP))
transExpression (BitAnd e1 e2) [d] = transExpressionStack e1 e2 d (AND (RegOprnd d) (IndirReg RSP))
transExpression (BitOr e1 e2) [d] = transExpressionStack e1 e2 d (OR (RegOprnd d) (IndirReg RSP))
transExpression (BitXor e1 e2) [d] = transExpressionStack e1 e2 d (XOR (RegOprnd d) (IndirReg RSP))
transExpression (LessThanEq e1 e2) [d] = transExpression (GreaterThanEq e2 e1) [d]
transExpression (LessThan e1 e2) [d] = transExpression (GreaterThan e2 e1) [d]


transExpression (Div e1 e2) [d] = 
   (transExpression e2 [d]) ++ [PUSHREG (RegOprnd d)] ++ (transExpression e1 [d])
    ++ [MOV (RegOprnd RAX)(RegOprnd d)] ++ [MOV (RegOprnd RBX)(IndirReg RSP)] 
    ++ [IDIV (RegOprnd EBX)] ++ [MOV (RegOprnd d)(RegOprnd RAX)] ++ [ADD (RegOprnd RSP) (ImmIntOprnd 8)]

transExpression (Mod e1 e2) [d] = 
   (transExpression e2 [d]) ++ [PUSHREG (RegOprnd d)] ++ (transExpression e1 [d])
    ++ [MOV (RegOprnd RAX)(RegOprnd d)] ++ [MOV (RegOprnd RBX)(IndirReg RSP)] 
    ++ [IDIV (RegOprnd EBX)] ++ [MOV (RegOprnd d)(RegOprnd RDX)] ++ [ADD (RegOprnd RSP) (ImmIntOprnd 8)]



transExpression (Equals e1 e2) [d] = 
   (transExpression e2 [d]) ++ [PUSHREG (RegOprnd d)]++ (transExpression e1 [d]) 
   ++  [CMP (RegOprnd d) (IndirReg RSP)] ++ [PUSHFQ] ++  [POP (RegOprnd RAX)] 
   ++ [AND (RegOprnd RAX) (ImmIntOprnd 64)] ++ [SAR (RegOprnd RAX) (ImmIntOprnd 6)]
   ++ [MOV (RegOprnd d) (RegOprnd RAX)] ++ [ADD (RegOprnd RSP) (ImmIntOprnd 8)]

transExpression (NotEquals e1 e2) [d] = 
  (transExpression e2 [d]) ++ [PUSHREG (RegOprnd d)]++ (transExpression e1 [d]) 
  ++ [CMP (RegOprnd d) (IndirReg RSP)] ++ [PUSHFQ] ++ [POP (RegOprnd RAX)] 
                       ++ [NOT (RegOprnd RAX)] ++ [AND (RegOprnd RAX) (ImmIntOprnd 64)] 
                       ++ [SAR (RegOprnd RAX) (ImmIntOprnd 6)]
                       ++ [MOV (RegOprnd d) (RegOprnd RAX)]
                       ++ [ADD (RegOprnd RSP) (ImmIntOprnd 8)]


transExpression (GreaterThan e1 e2) [d] =
   (transExpression e2 [d]) ++ [PUSHREG (RegOprnd d)]++ (transExpression e1 [d])  
   ++ [CMP (IndirReg RSP) (RegOprnd d)] ++ [PUSHFQ] ++ [POP (RegOprnd RAX)] 
                       ++ [AND (RegOprnd RAX) (ImmIntOprnd 128)] ++ [SAR (RegOprnd RAX) (ImmIntOprnd 7)]
                       ++ [MOV (RegOprnd d) (RegOprnd RAX)]
                       ++ [ADD (RegOprnd RSP) (ImmIntOprnd 8)]


transExpression (GreaterThanEq e1 e2) [d] = 
   (transExpression e2 [d]) ++ [PUSHREG (RegOprnd d)]++ (transExpression e1 [d])  
   ++ [CMP (RegOprnd d) (IndirReg RSP)] ++ [PUSHFQ] ++ [POP (RegOprnd RAX)] 
                       ++ [NOT (RegOprnd RAX)] ++  [AND (RegOprnd RAX) (ImmIntOprnd 128)] 
                       ++ [SAR (RegOprnd RAX) (ImmIntOprnd 7)]
                       ++ [MOV (RegOprnd d) (RegOprnd RAX)]
                       ++ [ADD (RegOprnd RSP) (ImmIntOprnd 8)]




transExpression (LogOr e1 e2) [d] = 
   (transExpression e2 [d]) ++ [PUSHREG (RegOprnd d)]++ (transExpression e1 [d])  
                       ++ [CMP (RegOprnd d) (ImmIntOprnd 0)] ++ [PUSHFQ] ++ [POP (RegOprnd RAX)] 
                       ++ [MOV (RegOprnd RBX) (RegOprnd RAX)]  
                       ++ [NOT (RegOprnd RAX)] 
                       ++ [AND (RegOprnd RAX) (ImmIntOprnd 64)] ++ [SAR (RegOprnd RAX) (ImmIntOprnd 6)]
                       ++ [AND (RegOprnd RBX) (ImmIntOprnd 64)] ++ [SAR (RegOprnd RBX) (ImmIntOprnd 6)]
                       ++ [IMUL (RegOprnd RAX) (RegOprnd d)]
                       ++ [IMUL (RegOprnd RBX) (IndirReg RSP)]
                       ++ [ADD (RegOprnd RAX) (RegOprnd RBX)]
                       ++ [MOV (RegOprnd d) (RegOprnd RAX)]
                       ++ [ADD (RegOprnd RSP) (ImmIntOprnd 8)]
        

           
transExpression (LogAnd e1 e2) [d] = 
  (transExpression e2 [d]) ++ [PUSHREG (RegOprnd d)] ++ (transExpression e1 [d])  
   ++ [CMP (IndirReg RSP) (ImmIntOprnd 0)] ++ [PUSHFQ] ++ [POP (RegOprnd RAX)] 
                       ++ [NOT (RegOprnd RAX)] 
                       ++ [AND (RegOprnd RAX) (ImmIntOprnd 64)] 
                       ++ [SAR (RegOprnd RAX) (ImmIntOprnd 6)]
                       ++ [MOV (RegOprnd RBX) (RegOprnd RAX)]  
                       ++ [CMP (RegOprnd d) (ImmIntOprnd 0)]
                       ++ [PUSHFQ]
                       ++ [POP (RegOprnd RAX)] 
                       ++ [NOT (RegOprnd RAX)] 
                       ++ [AND (RegOprnd RAX) (ImmIntOprnd 64)] 
                       ++ [SAR (RegOprnd RAX) (ImmIntOprnd 6)]
                       ++ [AND (RegOprnd RAX) (RegOprnd RBX)] 
                       ++ [IMUL (RegOprnd RAX) (IndirReg RSP)]
                       ++ [MOV (RegOprnd d) (RegOprnd RAX)]
                       ++ [ADD (RegOprnd RSP) (ImmIntOprnd 8)]
       
                         
-- The usual case where we have several registers free to work with.
-- We use the Sethi-Ullman ordering scheme.

transExpression (Plus e1 e2) (d:r:rs) = sethiUllman e1 e2 (d:r:rs) (ADD (RegOprnd d)(RegOprnd r))
transExpression (Minus e1 e2) (d:r:rs) = (transExpression e1 (d:r:rs)) ++ (transExpression e2 (r:rs)) ++ [SUB (RegOprnd d)(RegOprnd r)]
transExpression (Mult e1 e2) (d:r:rs) = sethiUllman e1 e2 (d:r:rs) (IMUL (RegOprnd d)(RegOprnd r))
transExpression (Div e1 e2) (d:r:rs) = (transExpression e2 (d:r:rs)) ++ (transExpression e1 (r:rs))  ++ (divInstrs d r)
transExpression (Mod e1 e2) (d:r:rs) = (transExpression e2 (d:r:rs)) ++ (transExpression e1 (r:rs)) ++ (modInstrs d r)
transExpression (BitAnd e1 e2) (d:r:rs) = sethiUllman e1 e2 (d:r:rs) (AND (RegOprnd d)(RegOprnd r))
transExpression (BitOr e1 e2) (d:r:rs) = sethiUllman e1 e2 (d:r:rs) (OR (RegOprnd d)(RegOprnd r))
transExpression (BitXor e1 e2) (d:r:rs) = sethiUllman e1 e2 (d:r:rs) (XOR (RegOprnd d)(RegOprnd r))
transExpression (BitNot e1) (d:rs) = (transExpression e1 (d:rs)) ++ [NOT (RegOprnd d)]
transExpression (Negate e1) (d:rs) = (transExpression e1 (d:rs)) ++ [NEG (RegOprnd d)]


transExpression (Equals e1 e2) (d:r:rs) = 
   if (weight e1 > weight e2)
   then (transExpression e1 (d:r:rs)) ++ (transExpression e2 (r:rs)) ++ comparison d r
   else (transExpression e2 (d:r:rs)) ++ (transExpression e1 (r:rs)) ++ comparison r d
   where comparison f s = [CMP (RegOprnd f) (RegOprnd s)] ++ [PUSHFQ] ++ [POP (RegOprnd RAX)] 
                       ++ [AND (RegOprnd RAX) (ImmIntOprnd 64)] ++ [SAR (RegOprnd RAX) (ImmIntOprnd 6)]
                       ++ [MOV (RegOprnd d) (RegOprnd RAX)]

transExpression (NotEquals e1 e2) (d:r:rs) = 
   if (weight e1 > weight e2)
   then (transExpression e1 (d:r:rs)) ++ (transExpression e2 (r:rs)) ++ comparison d r
   else (transExpression e2 (d:r:rs)) ++ (transExpression e1 (r:rs)) ++ comparison r d
   where comparison f s = [CMP (RegOprnd f) (RegOprnd s)] ++ [PUSHFQ] ++ [POP (RegOprnd RAX)] 
                           ++ [NOT (RegOprnd RAX)] ++ [AND (RegOprnd RAX) (ImmIntOprnd 64)] 
                           ++ [SAR (RegOprnd RAX) (ImmIntOprnd 6)]
                           ++ [MOV (RegOprnd d) (RegOprnd RAX)]

transExpression (LogNot e1) (d:rs) = 
   (transExpression e1 (d:rs)) ++ comparison
   where comparison = [CMP (RegOprnd d) (ImmIntOprnd 0)] ++ [PUSHFQ] ++ [POP (RegOprnd RAX)] 
                       ++ [AND (RegOprnd RAX) (ImmIntOprnd 64)] ++ [SAR (RegOprnd RAX) (ImmIntOprnd 6)]
                       ++ [MOV (RegOprnd d) (RegOprnd RAX)]
                       
transExpression (GreaterThan e1 e2) (d:r:rs) =
   if (weight e1 > weight e2)
   then (transExpression e1 (d:r:rs)) ++ (transExpression e2 (r:rs)) ++ comparison d r
   else (transExpression e2 (d:r:rs)) ++ (transExpression e1 (r:rs)) ++ comparison r d
   where comparison f s = [CMP (RegOprnd s) (RegOprnd f)] ++ [PUSHFQ] ++ [POP (RegOprnd RAX)] 
                              ++ [AND (RegOprnd RAX) (ImmIntOprnd 128)] ++ [SAR (RegOprnd RAX) (ImmIntOprnd 7)]
                              ++ [MOV (RegOprnd d) (RegOprnd RAX)]


transExpression (GreaterThanEq e1 e2) (d:r:rs) = 
   if (weight e1 > weight e2)
   then (transExpression e1 (d:r:rs)) ++ (transExpression e2 (r:rs)) ++ comparison d r
   else (transExpression e2 (d:r:rs)) ++ (transExpression e1 (r:rs)) ++ comparison r d
   where comparison f s = [CMP (RegOprnd f) (RegOprnd s)] ++ [PUSHFQ] ++ [POP (RegOprnd RAX)] 
                       ++ [NOT (RegOprnd RAX)] ++  [AND (RegOprnd RAX) (ImmIntOprnd 128)] 
                       ++ [SAR (RegOprnd RAX) (ImmIntOprnd 7)]
                       ++ [MOV (RegOprnd d) (RegOprnd RAX)]


transExpression (LessThanEq e1 e2) (d:r:rs) = 
   if (weight e1 > weight e2)
   then (transExpression e1 (d:r:rs)) ++ (transExpression e2 (r:rs)) ++ comparison d r
   else (transExpression e2 (d:r:rs)) ++ (transExpression e1 (r:rs)) ++ comparison r d
   where comparison f s = [CMP (RegOprnd s) (RegOprnd f)] ++ [PUSHFQ] ++ [POP (RegOprnd RAX)] 
                       ++ [NOT (RegOprnd RAX)] ++ [AND (RegOprnd RAX) (ImmIntOprnd 128)] 
                       ++ [SAR (RegOprnd RAX) (ImmIntOprnd 7)]
                       ++ [MOV (RegOprnd d) (RegOprnd RAX)]


transExpression (LessThan e1 e2) (d:r:rs) = 
   if (weight e1 > weight e2)
   then (transExpression e1 (d:r:rs)) ++ (transExpression e2 (r:rs)) ++ comparison d r
   else (transExpression e2 (d:r:rs)) ++ (transExpression e1 (r:rs)) ++ comparison r d
   where comparison f s = [CMP (RegOprnd f) (RegOprnd s)] ++ [PUSHFQ] ++ [POP (RegOprnd RAX)] 
                       ++ [AND (RegOprnd RAX) (ImmIntOprnd 128)] ++ [SAR (RegOprnd RAX) (ImmIntOprnd 7)]
                       ++ [MOV (RegOprnd d) (RegOprnd RAX)]
        
transExpression (LogOr e1 e2) (d:r:rs) = 
   if (weight e1 > weight e2)
   then (transExpression e1 (d:r:rs)) ++ (transExpression e2 (r:rs)) ++ comparison d r
   else (transExpression e2 (d:r:rs)) ++ (transExpression e1 (r:rs)) ++ comparison r d
   where comparison f s = [CMP (RegOprnd f) (ImmIntOprnd 0)] ++ [PUSHFQ] ++ [POP (RegOprnd RAX)] 
                       ++ [MOV (RegOprnd RBX) (RegOprnd RAX)]  
                       ++ [NOT (RegOprnd RAX)] 
                       ++ [AND (RegOprnd RAX) (ImmIntOprnd 64)] ++ [SAR (RegOprnd RAX) (ImmIntOprnd 6)]
                       ++ [AND (RegOprnd RBX) (ImmIntOprnd 64)] ++ [SAR (RegOprnd RBX) (ImmIntOprnd 6)]
                       ++ [IMUL (RegOprnd RAX) (RegOprnd f)]
                       ++ [IMUL (RegOprnd RBX) (RegOprnd s)]
                       ++ [ADD (RegOprnd RAX) (RegOprnd RBX)]
                       ++ [MOV (RegOprnd d) (RegOprnd RAX)]

transExpression (LogAnd e1 e2) (d:r:rs) = 
   if (weight e1 > weight e2)
   then (transExpression e1 (d:r:rs)) ++ (transExpression e2 (r:rs)) ++ comparison d r
   else (transExpression e2 (d:r:rs)) ++ (transExpression e1 (r:rs)) ++ comparison r d
   where comparison f s =  [CMP (RegOprnd f) (ImmIntOprnd 0)] ++ [PUSHFQ] ++ [POP (RegOprnd RAX)] 
                       ++ [NOT (RegOprnd RAX)] 
                       ++ [AND (RegOprnd RAX) (ImmIntOprnd 64)] 
                       ++ [SAR (RegOprnd RAX) (ImmIntOprnd 6)]
                       ++ [MOV (RegOprnd RBX) (RegOprnd RAX)]  
                       ++ [CMP (RegOprnd s) (ImmIntOprnd 0)]
                       ++ [PUSHFQ]
                       ++ [POP (RegOprnd RAX)] 
                       ++ [NOT (RegOprnd RAX)] 
                       ++ [AND (RegOprnd RAX) (ImmIntOprnd 64)] 
                       ++ [SAR (RegOprnd RAX) (ImmIntOprnd 6)]
                       ++ [AND (RegOprnd RAX) (RegOprnd RBX)] 
                       ++ [IMUL (RegOprnd RAX) (RegOprnd s)]
                       ++ [MOV (RegOprnd d) (RegOprnd RAX)]   


transExpression (MExpRoomCall (RoomCall id args)) (d:rs) =
   saveRegs ++ (pushArgs args (d:rs)) ++ [CALL id] ++ [MOV (RegOprnd d) (RegOprnd RAX)]  ++ [ADD (RegOprnd RSP) (ImmIntOprnd ((length args) * 8))] ++ restoreRegs
   where saveRegs = [PUSH (RegOprnd r) | r  <- (allRegs \\ (d:rs))]
         restoreRegs = reverse [POP (RegOprnd r) | r  <- (allRegs \\ (d:rs))]



pushArgs :: [Argument] -> [IntelRegister] -> [IntelInstruction]
pushArgs [] _  = []
pushArgs ((MExpArg mexp):args) (d:rs) = transExpression mexp (d:rs) ++ [PUSH (RegOprnd d)] ++ pushArgs args (d:rs)
pushArgs ((LetterArg c):args) (d:rs) = [PUSH (ImmCharOprnd c)] ++ pushArgs args (d:rs)
pushArgs ((SentenceArg c):args) (d:rs) = []



sethiUllman e1 e2 (d:r:rs) instr = 
  if (weight e1 > weight e2) 
  then (transExpression e1 (d:r:rs)) ++ (transExpression e2 (r:rs)) ++ [instr]
  else (transExpression e2 (d:r:rs)) ++ (transExpression e1 (r:rs)) ++ [instr]


sethiUllmanComparison e1 e2 (d:r:rs) compInstrs  = 
  if (weight e1 > weight e2) 
  then (transExpression e1 (d:r:rs)) ++ (transExpression e2 (r:rs)) ++ compInstrs d r
  else (transExpression e2 (d:r:rs)) ++ (transExpression e1 (r:rs)) ++ compInstrs r d 



---------- weight function ------------

weight :: MExp -> Int
weight (MExpVar x) = 1
weight (IntLit x) = 1
weight (Plus e1 e2) = weight' e1 e2
weight (Minus e1 e2) = weight' e1 e2
weight (Mult e1 e2) = weight' e1 e2
weight (Div e1 e2) = weight' e1 e2
weight (Mod e1 e2) = weight' e1 e2
weight (BitAnd e1 e2) = weight' e1 e2
weight (BitOr e1 e2) = weight' e1 e2
weight (BitXor e1 e2) = weight' e1 e2
weight (BitNot e1) = 1 + weight e1 
weight (Negate e1) = 1 + weight e1 
weight (Equals e1 e2) = weight' e1 e2
weight (NotEquals e1 e2) = weight' e1 e2
weight (LogAnd e1 e2) = weight' e1 e2
weight (LogOr e1 e2) = weight' e1 e2
weight (LessThan e1 e2) = weight' e1 e2
weight (LessThanEq e1 e2) = weight' e1 e2      
weight (GreaterThanEq e1 e2) = weight' e1 e2          
weight (LogNot e1) = 1 + weight e1       
weight (MExpRoomCall (RoomCall id args)) = 1  
   
weight' :: MExp -> MExp -> Int
weight' e1 e2 = min cost1 cost2
    where 
    cost1 = max (weight e1) (weight e2 + 1)
    cost2 = max (weight e1 + 1) (weight e2)
