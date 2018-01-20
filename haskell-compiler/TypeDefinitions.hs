module TypeDefinitions where
{- This file defines types which are used in other parts of the project -}

--------------------------------------------------------
-- Type Definitions for Abstract Syntax Tree
---------------------------------------------------------

data Prog = Program [Statement] [RoomDef]
      deriving (Show, Eq)

data Statement = Comment String | 
      DeclareNumber String |
      DeclareLetter String |
      DeclareSentence String |
      DeclareNumberArray String Int |
      DeclareLetterArray String Int |
      DeclareSentenceArray String Int |

      AssignVarToVar String String |
      AssignNumber String MExp |
      AssignLetter String Char |
      AssignSentence String String |
      AssignMExpToArray String Int MExp |
      AssignVarToArray String Int String |
      AssignLetterToArray String Int Char |
      AssignSentenceToArray String Int String |
      AssignRoomCall String RoomCallDef |

      InputNumber String |
      VarAte String | 
      VarDrank String |
      Conditional MExp [Statement] [Statement] |
      Eventually MExp [Statement] |

      VarSpoke String |
      NumberVarSpoke String |
      LetterVarSpoke String |
      SentenceVarSpoke String |
      ArrayVarSpoke String |
      MExpSpoke MExp |
      LetterSpoke Char |
      SentenceSpoke String |
      NumberRoomCallSpoke RoomCallDef |
      LetterRoomCallSpoke RoomCallDef |
      SentenceRoomCallSpoke RoomCallDef |
      RoomCallSpoke RoomCallDef |
      SendThroughLookingGlass LookingGlassDef |

      AliceFoundVar String |
      AliceFoundNumberVar String |
      AliceFoundLetterVar String |
      AliceFoundSentenceVar String |
      AliceFoundMExp MExp |
      AliceFoundLetter Char |
      AliceFoundSentence String |
      AliceFoundRoomCall RoomCallDef
      deriving (Show, Eq)


data RoomCallDef = RoomCall String [Argument]
                 deriving (Show, Eq)

data RoomDef = Room String [Parameter] [Statement] VariableType Int
            deriving (Show, Eq)

data LookingGlassDef = LookingGlass String [Statement] VariableType Int
                     deriving (Show, Eq)


type Parameter = (VariableType, String)
data Argument = MExpArg MExp | LetterArg Char | SentenceArg String 
              deriving (Show, Eq)

data MExp = Plus MExp MExp |
      Minus MExp MExp | 
      Mult MExp MExp |
      Div MExp MExp |
      Mod MExp MExp |
      BitAnd MExp MExp |
      BitOr MExp MExp |
      BitXor MExp MExp |
      BitNot MExp |
      Negate MExp |
      LogAnd MExp MExp |
      LogOr MExp MExp |
      LessThan MExp MExp |
      LessThanEq MExp MExp |
      GreaterThan MExp MExp |
      GreaterThanEq MExp MExp |
      LogNot MExp |
      Equals MExp MExp |
      NotEquals MExp MExp |
      MExpVar String |
      IntLit Int |
      MExpRoomCall RoomCallDef
      deriving (Show, Eq)


--------------------------------------------------------
-- Type Definitions for Semenatic Errors
---------------------------------------------------------

-- The symbol table stores, as a list of tuples, the id and type of variables in the program.
type DataSectionTable = [(String, CodeGenData)]
type LocalScopeTable = [(String, String, VariableType)]
--type SemanticCheck = ([Statement], [SemanticError], [LocalScopeTable], GlobalTable)
--type RoomSemanticCheck = ([RoomDef], [SemanticError], LocalScopeTable, GlobalTable)

data CodeGenData = LabelType



-- Helper functions for doing lookups in the symbol table
isInScope :: String -> [LocalScopeTable] -> Bool
isInScope id [] = False
isInScope id (l:ls) 
   | elem id lids = True
   | otherwise = isInScope id ls
   where (lids, gids, types) = unzip3 l

notInScope :: String -> [LocalScopeTable] -> Bool
notInScope id ls = not (isInScope id ls)

inLocalTable :: String -> LocalScopeTable -> Bool
inLocalTable id l = elem id [ l | (l, g, t) <- l, l == id]


isANumberInScope :: String -> [LocalScopeTable] -> Bool
isANumberInScope id [] = False
isANumberInScope id (l:ls)
   | elem id [lid | (lid, gid, t) <- l, lid == id, t == NumberType] = True
   | otherwise = isANumberInScope id ls


isALetterInScope :: String -> [LocalScopeTable] -> Bool
isALetterInScope id [] = False
isALetterInScope id (l:ls)
   | elem id [lid | (lid, gid, t) <- l, lid == id, t == LetterType] = True
   | otherwise = isALetterInScope id ls

isASentenceInScope :: String -> [LocalScopeTable] -> Bool
isASentenceInScope id [] = False
isASentenceInScope id (l:ls)
   | elem id [lid | (lid, gid, t) <- l, lid == id, t == SentenceType] = True
   | otherwise = isASentenceInScope id ls


isANumberRoomInScope :: String -> [LocalScopeTable] -> Bool
isANumberRoomInScope id [] = False
isANumberRoomInScope id (l:ls)
   | elem id [lid | (lid, gid, (RoomType ps NumberType)) <- l, lid == id] = True
   | otherwise = isANumberRoomInScope id ls

isALetterRoomInScope :: String -> [LocalScopeTable] -> Bool
isALetterRoomInScope id [] = False
isALetterRoomInScope id (l:ls)
   | elem id [lid | (lid, gid, (RoomType ps LetterType)) <- l, lid == id] = True
   | otherwise = isALetterRoomInScope id ls

isASentenceRoomInScope :: String -> [LocalScopeTable] -> Bool
isASentenceRoomInScope id [] = False
isASentenceRoomInScope id (l:ls)
   | elem id [lid | (lid, gid, (RoomType ps SentenceType)) <- l, lid == id] = True
   | otherwise = isASentenceRoomInScope id ls

lookupGlobalId :: String -> [LocalScopeTable] -> String
lookupGlobalId id [] = []
lookupGlobalId id (l:ls)
   | inLocalTable id l = head [ g | (l, g, t) <- l, l == id]
   | otherwise = lookupGlobalId id ls



{-

inTable :: String -> GlobalTable -> Bool
inTable ident table = elem ident xs where (xs, ts) = unzip table 

notInTable :: String ->  GlobalTable -> Bool
notInTable id table = null [ x | (x, t) <- table, x == id]

lookupTypeInTable :: String -> GlobalTable -> VariableType
lookupTypeInTable id table
    | inTable id table = head [ t | (x, t) <- table, x == id]
    | otherwise = UnknownType

isANumberInTable :: String -> GlobalTable -> Bool
isANumberInTable id table = elem id [ x | (x, t) <- table, x == id, t == NumberType]

isALetterInTable :: String -> GlobalTable -> Bool
isALetterInTable id table = elem id [ x | (x, t) <- table, x == id, t == LetterType]
-}

data VariableType = NumberType | LetterType | SentenceType 
                         | NumberArrayType Int 
                         | LetterArrayType Int 
                         | SentenceArrayType Int 
                         | UnknownType
                         | RoomType [Parameter] VariableType
                    deriving (Eq, Show)

data Array = VariableType Int String

-- Semantic Analyser error data type and what it outputs to the console

data SemanticError = RepeatDefOfVar String
        | LetterVarInMExp String
        | NumberCantBecomeLetter String
        | LetterCantBecomeNumber String
        | NumberCantBecomeVar String String
        | LetterCantBecomeVar String String
        | SentenceCantBecomeVar String String
        | NotMentionedVar String
        | AssignToUnknown String
        | LetterEating String
        | LetterDrinking String
        | NumberCantBecomeRoom String String
        | LetterCantBecomeRoom String String
        | SentenceCantBecomeRoom String String
      deriving (Eq)

instance Show SemanticError where
    show (RepeatDefOfVar id) = "Silly you! You already told me what '" ++ id ++ "' was"
    show (LetterVarInMExp id) = "Silly you! You can't use '" ++ id ++ "' in an expression like that "
    show (NumberCantBecomeVar id1 id2) = "Silly you! '" ++ id1 ++ "' was a number. It's type tells us it couldn't have become '" ++ id2 ++ "'" 
    show (LetterCantBecomeVar id1 id2) = "Silly you! '" ++ id1 ++ "' was a letter. It's type tells us it couldn't have become '" ++ id2 ++ "'" 
    show (SentenceCantBecomeVar id1 id2) = "Silly you! '" ++ id1 ++ "' was a sentence. It's type tells us it couldn't have become '" ++ id2 ++ "'" 
    show (NotMentionedVar id) = "Now look, you can't go around mentioning '" ++ id ++ "' without telling me what it is first."
    show (AssignToUnknown id) =  id ++ " wasn't sure what it was becoming, something else must have gone wrong!"
    show (LetterEating id) =  "Silly you! You know you could have only eaten numbers. '" ++ id ++ "' is a letter."
    show (LetterDrinking id) =  "Silly you! You know you could have only eaten numbers. '" ++ id ++ "' is a number."
    show (NumberCantBecomeRoom id1 id2) =  "Silly you!'" ++ id1 ++ "' is a number. It's type tells us it couldn't have been in the room '" ++ id2 ++ "'"
    show (LetterCantBecomeRoom id1 id2) =  "Silly you!'" ++ id1 ++ "' is a letter. It's type tells us that it couldn't have been in the room " ++ id2 ++ "'"
    show (SentenceCantBecomeRoom id1 id2) =  "Silly you!'" ++ id1 ++ "' is a letter. It's type tells us that it couldn't have been in the room " ++ id2 ++ "'"


--------------------------------------------------------
-- Type Definitions for Code Generation and Registers
---------------------------------------------------------

-- Haskell representation of intel registers and instructions

data IntelRegister = RAX | RBX | RCX | RDX | EDX | R8 | R9 | R10 | R11 | R12 | R13 | R14 | R15 | EBX | RSP | RBP
                   deriving (Show, Eq)

data IntelInstruction = MOV32 IntelOperand IntelOperand |
      MOV IntelOperand IntelOperand |
      ADD IntelOperand IntelOperand |
      SUB IntelOperand IntelOperand |
      IMUL IntelOperand IntelOperand |
      XOR IntelOperand IntelOperand |
      AND IntelOperand IntelOperand |
      OR IntelOperand IntelOperand |
      IDIV IntelOperand |
      NEG IntelOperand |
      NOT IntelOperand |
      PUSHREG IntelOperand |
      INC String |
      DEC String |
      JE String |
      JNE String |
      CMP IntelOperand IntelOperand |
      JMP String |
      CALL String |
      LABEL String |
      PUSHFQ | 
      POP IntelOperand |
      SAR IntelOperand IntelOperand |
      PUSH IntelOperand |
      RETURN |
      PRINTMEXP | 
      PRINTLET Char |
      PRINTLETREG |
      PRINTNUMVAR String | 
      PRINTLETVAR String |
      PRINTSENTENCEVAR String |
      PRINTSTR String |
      LOADSTR String String |
      STARTARRAY String String Int |
      SETINDEX String IntelOperand Int 
      deriving (Eq)

-- The assembly code that will be generated for each instruction represented
instance Show IntelInstruction where
    show (MOV32 a b) = "MOV DWORD " ++ show a ++ ", " ++ show b
    show (MOV a b) = "MOV QWORD " ++ show a ++ ", " ++ show b
    show (ADD a b) = "ADD " ++ show a ++ ", " ++ show b 
    show (SUB a b) = "SUB " ++ show a ++ ", " ++ show b
    show (IMUL a b) = "IMUL " ++ show a ++ ", " ++ show b
    show (XOR a b) = "XOR " ++ show a ++ ", " ++ show b
    show (AND a b) = "AND " ++ show a ++ ", " ++ show b
    show (OR a b) = "OR " ++ show a ++ ", " ++ show b
    show (IDIV a) = "IDIV " ++ show a
    show (NEG a) = "NEG " ++ show a
    show (NOT a) = "NOT " ++ show a
    show (PUSHREG a) = "PUSH " ++ show a
    show (INC a) = "INC QWORD [" ++ a ++ "]"
    show (DEC a) = "DEC QWORD [" ++ a ++ "]"
    show (JE l) = "JE " ++ l
    show (JNE l) = "JNE " ++ l
    show (CMP a b) = "CMP QWORD " ++ show a ++ ", " ++ show b
    show (LABEL l) = "\n" ++ l ++ ":"
    show (JMP l) = "JMP " ++ l
    show (CALL l) = "CALL " ++ l
    show (PUSHFQ) = "PUSHFQ " 
    show (POP l) = "POP " ++ show l
    show (SAR a b) = "SAR " ++ show a ++ ", " ++ show b
    show (PUSH a) = "PUSH QWORD " ++ show a
    show (RETURN) = "MOV QWORD RSP, RBP \nPOP RBP\nRET"
    show (PRINTLETREG) = "PUSH QWORD " ++ show topReg ++ "\nCALL output_char\n ADD RSP, 8"
    show (PRINTMEXP) = "PUSH QWORD " ++ show topReg ++ "\nCALL output_int\n ADD RSP, 8"
    show (PRINTLET a) = "PUSH QWORD '" ++ [a] ++ "'\nCALL output_char\n ADD RSP, 8"
    show (PRINTNUMVAR a) = "PUSH QWORD [" ++ a ++ "]\nCALL output_int\n ADD RSP, 8" 
    show (PRINTLETVAR a) = "PUSH QWORD [" ++ a ++ "]\nCALL output_char\n ADD RSP, 8"
    show (LOADSTR id str) = "LoadRegWithStrAddr RAX, \""++ str ++"\" , 0\n MOV ["++id++"], RAX"
    show (PRINTSTR str) = "LoadRegWithStrAddr RAX, \""++str++"\",0\nPUSH RBX\n PUSH RAX\nCALL outfunc \nADD RSP,8"
    show (PRINTSENTENCEVAR id) = "PUSH QWORD ["++id++"]\nCALL outfunc \nADD RSP,8"
    show (STARTARRAY id str size) = "LoadRegWithArray rbx, "++(xNTimes str size)++"\nmov ["++id++"], rbx"
    show (SETINDEX id reg index) =  "MOV RAX, ["++id++"]\n; MOV [ RAX + "++(show (8*index))++"], "++ show reg
    
xNTimes x 0 = ""
xNTimes x 1 = x
xNTimes x n = x ++ (',':(xNTimes x (n-1)))


data IntelOperand = ImmIntOprnd Int |
                    ImmCharOprnd Char | 
                    RegOprnd IntelRegister |
                    VarLabel String |
                    IndirReg IntelRegister |
                    LabelOprnd String 
                    deriving (Eq)
             
instance Show IntelOperand where
    show (ImmIntOprnd a) = show(a)
    show (ImmCharOprnd a) = show(a)
    show (RegOprnd a) = show(a)
    show (VarLabel a) = "[" ++ a ++ "]"
    show (IndirReg r) = "[" ++ show(r) ++ "]"
    show (LabelOprnd l) = show(l)
    
-- A list of registers that are free to be used by the codegenerator.
allRegs = [RCX, R8, R9, R10, R11, R12, R13, R14, R15]
--allRegs = [RCX]
topReg = head allRegs
