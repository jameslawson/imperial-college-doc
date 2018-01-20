module SemanticAnalyser where
import TypeDefinitions

-- recursively go through statements and use GlobalTable as an accumlating parameter to
-- hold variables and inferred type. At the same time, we also build a list of Errors to 
-- be printed. 
-- (1) when we declare a variable, it can either be already defined (RepeatDefOfVar error)
--     or we add it to the symbol table
-- (2) when we assign a value to a variable, we need to first check that the variable has been defined
--     then we check the semantics of what we assign to the variable. If we assign a mexp to it, we 
--     call mexpSemantic, if we assign a var to it, we check that that var exists and it is of the correct type.
-- (3) when a variable eats or drinks, we must check the symbol table to see that it is the number type
-- (4) for spoke statements, if a var spokes, we check that the var has been defined. if a mexp spoke, we call
--     the helper mexpSemantic to check the semantics of mexp. if a letter literal spoke, it is always valid.


createGlobalScope :: [RoomDef] -> LocalScopeTable
createGlobalScope [] = []
createGlobalScope ((Room id ps stmts r _):rooms) = (id, gid, (RoomType ps r)) : createGlobalScope rooms
     where gid = "f" ++ (show (length rooms)) ++ id


semanticAnalysis :: [RoomDef] -> LocalScopeTable -> ([RoomDef], [SemanticError]) -> ([RoomDef], [SemanticError]) 
semanticAnalysis [] gScope (rrms, errs) = (rrms, errs)
semanticAnalysis (rm:rms) gScope (rrms, errs) = semanticAnalysis rms gScope (rrms', errs')
      where (rrm, rmerrs) = (roomSemantic rm  gScope)
            rrms' = rrms ++ [rrm]
            errs' = errs ++ rmerrs 

roomSemantic :: RoomDef -> LocalScopeTable -> (RoomDef, [SemanticError])
roomSemantic (Room id ps stmts r _) gScope = (rRoomDef, errs')
   where (rps, lScopeWithgScope) = paramSemantic ps ([], []:[gScope])
         (rstmts, errs', _, numLocalVars) = semantic stmts ([], [], ([]:lScopeWithgScope), 0)
         rRoomDef = (Room gid rps rstmts r numLocalVars)
         gid = lookupGlobalId id [gScope]


paramSemantic :: [Parameter] -> ([Parameter], [LocalScopeTable]) -> ([Parameter], [LocalScopeTable])
paramSemantic [] (rps, l) = (rps, l)
paramSemantic ((t, id):ps) (rps, (l:ls)) = paramSemantic ps (rps', (l':ls))
  where rps'  = rps ++ [(t, rid)]
        l'  = l ++ [(id, rid, t)]
        rid  = "RBP + " ++ show(((length ps) + 2) * 8)


{-------------------------------------------------------------------}


semantic :: [Statement] -> ([Statement], [SemanticError], [LocalScopeTable], Int) -> ([Statement], [SemanticError], [LocalScopeTable], Int)
semantic [] (rstmts, errs, (l:ls), i) = (rstmts, errs, (l:ls), i) 

semantic ((Comment str):stmts) ls
    = semantic stmts ls

semantic ((DeclareNumber id):stmts) (rstmts, errs, (l:ls), i) 
   | inLocalTable id l = semantic stmts (rstmts', errs', ls', (i+1)) 
   | otherwise         = semantic stmts (rstmts', errs, ls', (i+1)) 
   where newid         = "RBP - " ++ (show (8 * (i + 1)))
         rstmts'       = rstmts ++ [(DeclareNumber newid)]
         errs'         = errs ++ [(RepeatDefOfVar id)] 
         ls'           = [(id, newid, NumberType):l] ++ ls


semantic ((DeclareLetter id):stmts) (rstmts, errs, (l:ls), i) 
   | inLocalTable id l = semantic stmts (rstmts', errs', ls', (i+1)) 
   | otherwise         = semantic stmts (rstmts', errs, ls', (i+1)) 
   where newid         = "RBP - " ++ (show (8 * (i + 1)))
         rstmts'       = rstmts ++ [(DeclareLetter newid)]
         errs'         = errs ++ [(RepeatDefOfVar id)] 
         ls'           = [(id, newid, LetterType):l] ++ ls


semantic ((DeclareSentence id):stmts) (rstmts, errs, (l:ls), i)
   | inLocalTable id l = semantic stmts (rstmts', errs', ls', (i+1)) 
   | otherwise         = semantic stmts (rstmts', errs, ls', (i+1)) 
   where newid         = "RBP - " ++ (show (8 * (i + 1)) )
         rstmts'       = rstmts ++ [(DeclareSentence newid)]
         errs'         = errs ++ [(RepeatDefOfVar id)] 
         ls'           = [(id, newid, SentenceType):l] ++ ls
         
         
         
semantic ((DeclareNumberArray id size):stmts) (rstmts, errs, (l:ls), i)
   | inLocalTable id l = semantic stmts (rstmts', errs', ls', (i+1)) 
   | otherwise         = semantic stmts (rstmts', errs, ls', (i+1)) 
   where newid         = "RBP - " ++ (show (8 * (i + 1)) )
         rstmts'       = rstmts ++ [(DeclareNumberArray newid size)]
         errs'         = errs ++ [(RepeatDefOfVar id)] 
         ls'           = [(id, newid, NumberArrayType size):l] ++ ls
         
semantic ((DeclareLetterArray id size):stmts) (rstmts, errs, (l:ls), i)
   | inLocalTable id l = semantic stmts (rstmts', errs', ls', (i+1)) 
   | otherwise         = semantic stmts (rstmts', errs, ls', (i+1)) 
   where newid         = "RBP - " ++ (show (8 * (i + 1)) )
         rstmts'       = rstmts ++ [(DeclareLetterArray newid size)]
         errs'         = errs ++ [(RepeatDefOfVar id)] 
         ls'           = [(id, newid, LetterArrayType size):l] ++ ls


semantic ((DeclareSentenceArray id size):stmts) (rstmts, errs, (l:ls), i)
   | inLocalTable id l = semantic stmts (rstmts', errs', ls', (i+1)) 
   | otherwise         = semantic stmts (rstmts', errs, ls', (i+1)) 
   where newid         = "RBP - " ++ (show (8 * (i + 1)) )
         rstmts'       = rstmts ++ [(DeclareSentenceArray newid size)]
         errs'         = errs ++ [(RepeatDefOfVar id)] 
         ls'           = [(id, newid, SentenceArrayType size):l] ++ ls
   



semantic ((AssignNumber id mexp):stmts) (rstmts, errs, ls, i) 
   | notInScope id ls        = semantic stmts (rstmts', notScopErr, ls, i)
   | not (isANumberInScope id ls)  = semantic stmts (rstmts', errs1, ls, i)
   | otherwise               = semantic stmts (rstmts', errs', ls, i) 
   where (rmexp, errsmexp) = mexpSemantic mexp (errs, ls)
         rstmts'     = rstmts ++ [AssignNumber rid rmexp]
         notScopErr  = errs ++ errsmexp ++ [NotMentionedVar id]
         errs1       = errs ++ errsmexp ++ [NumberCantBecomeLetter id]
         errs'       = errs ++ errsmexp
         rid         = lookupGlobalId id ls


semantic ((AssignLetter id c):stmts) (rstmts, errs, ls, i) 
   | notInScope id ls        = semantic stmts (rstmts', notScopErr, ls, i)
   | not (isALetterInScope id ls)  = semantic stmts (rstmts, errs', ls, i)
   | otherwise               = semantic stmts (rstmts', errs, ls, i) 
   where rstmts'     = rstmts ++ [AssignLetter rid c]
         notScopErr  = errs ++ [NotMentionedVar id]
         errs'   = errs ++ [LetterCantBecomeNumber id]
         rid         = lookupGlobalId id ls
       
         
semantic ((AssignSentence id str):stmts) (rstmts, errs, ls, i)
   | notInScope id ls = semantic stmts (rstmts', errs', ls, i) 
   | otherwise         = semantic stmts (rstmts', errs, ls, i) 
   where rid         = lookupGlobalId id ls
         rstmts'       = rstmts ++ [(AssignSentence rid str)]
         errs'         = errs ++ [(RepeatDefOfVar id)] 
         
        

semantic ((AssignRoomCall id1 (RoomCall id2 args)):stmts) (rstmts, errs, ls, i) 
   | notInScope id1 ls        = semantic stmts (rstmts, notScopErr1, ls, i)
   | notInScope id2 ls        = semantic stmts (rstmts, notScopErr2, ls, i)
   | isANumberInScope id1 ls && (not (isANumberRoomInScope id2 ls))  = semantic stmts (rstmts, errs1, ls, i)
   | isALetterInScope id1 ls && (not (isALetterRoomInScope id2 ls))  = semantic stmts (rstmts, errs2, ls, i)
   | isASentenceInScope id1 ls && (not (isALetterRoomInScope id2 ls))  = semantic stmts (rstmts, errs2, ls, i)
   | otherwise               = semantic stmts (rstmts', errs, ls, i) 
   where rid1         = lookupGlobalId id1 ls
         rid2         = lookupGlobalId id2 ls
         rstmts'     = rstmts ++ [(AssignRoomCall rid1 (RoomCall rid2 rargs))]
         notScopErr1  = errs ++ [NotMentionedVar id1] ++ argserrs
         notScopErr2  = errs ++ [NotMentionedVar id1] ++ argserrs
         errs1   = errs ++ [NumberCantBecomeRoom id1 id2] ++ argserrs
         errs2   = errs ++ [LetterCantBecomeRoom id1 id2] ++ argserrs
         errs3   = errs ++ [SentenceCantBecomeRoom id1 id2] ++ argserrs
         (rargs, argserrs) = argsSemantic args ls ([], [])



semantic ((AssignVarToVar id1 id2):stmts) (rstmts, errs, ls, i) 
   | notInScope id1 ls        = semantic stmts (rstmts', notScopErr1, ls, i)
   | notInScope id2 ls        = semantic stmts (rstmts', notScopErr2, ls, i)
   | (isANumberInScope id1 ls) && (not (isANumberInScope id2 ls))  = semantic stmts (rstmts, errs1, ls, i)
   | (isALetterInScope id1 ls) && (not (isALetterInScope id2 ls))  = semantic stmts (rstmts, errs2, ls, i)
   | (isASentenceInScope id1 ls) && (not (isASentenceInScope id2 ls))  = semantic stmts (rstmts, errs3, ls, i)
   | otherwise               = semantic stmts (rstmts', errs, ls, i) 
   where rid1         = lookupGlobalId id1 ls
         rid2         = lookupGlobalId id2 ls
         rstmts'     = rstmts ++ [(AssignVarToVar rid1 rid2)]
         notScopErr1  = errs ++ [NotMentionedVar id1]
         notScopErr2  = errs ++ [NotMentionedVar id2]
         errs1   = errs ++ [NumberCantBecomeVar id1 id2]
         errs2   = errs ++ [LetterCantBecomeVar id1 id2]
         errs3   = errs ++ [SentenceCantBecomeVar id1 id2]


semantic ((AssignMExpToArray id index mexp):stmts) (rstmts, errs, ls, i)
   | notInScope id ls = semantic stmts (rstmts, errs', ls, i) 
   | otherwise         = semantic stmts (rstmts', mexperr, ls, i) 
   where (rmexp, mexperr) = mexpSemantic mexp (errs, ls)
         rid           = lookupGlobalId id ls
         errs'         = errs ++ [NotMentionedVar id]
         rstmts'       = rstmts ++ [(AssignMExpToArray rid index rmexp)]
         

semantic ((AssignVarToArray id1 index id2):stmts) (rstmts, errs, ls, i)
   | notInScope id1 ls        = semantic stmts (rstmts', notScopErr1, ls, i)
   | notInScope id2 ls        = semantic stmts (rstmts', notScopErr2, ls, i)
   | otherwise                = semantic stmts (rstmts', errs, ls, i) 
   where rid1           = lookupGlobalId id1 ls
         rid2           = lookupGlobalId id2 ls
         notScopErr1  = errs ++ [NotMentionedVar id1]
         notScopErr2  = errs ++ [NotMentionedVar id2]
         rstmts'        = rstmts ++ [(AssignVarToArray rid1 index rid2)]

semantic ((AssignLetterToArray id index c):stmts) (rstmts, errs, ls, i)
   | notInScope id ls = semantic stmts (rstmts, errs', ls, i) 
   | otherwise        = semantic stmts (rstmts', errs, ls, i) 
   where rid          = lookupGlobalId id ls
         errs'         = errs ++ [NotMentionedVar id]
         rstmts'      = rstmts ++ [(AssignLetterToArray rid index c)]

semantic ((AssignSentenceToArray id index str):stmts) (rstmts, errs, ls, i)
   | notInScope id ls = semantic stmts (rstmts, errs', ls, i) 
   | otherwise        = semantic stmts (rstmts', errs, ls, i) 
   where rid          = lookupGlobalId id ls
         errs'         = errs ++ [NotMentionedVar id]
         rstmts'      = rstmts ++ [(AssignSentenceToArray rid index str)]


semantic ((VarAte id):stmts) (rstmts, errs, (l:ls), i)
   | notInScope id ls        = semantic stmts (rstmts', notScopeErr, ls, (i+1))
   | isALetterInScope id ls  = semantic stmts (rstmts', letterErr, ls, (i+1))
   | otherwise               = semantic stmts (rstmts', errs, ls, (i+1)) 
   where rstmts'     = rstmts ++ [(VarAte newid)]
         notScopeErr   = errs ++ [NotMentionedVar id]
         letterErr     = errs ++ [LetterEating id]
         newid         = lookupGlobalId id ls


semantic ((VarDrank id):stmts) (rstmts, errs, (l:ls), i)
   | notInScope id ls        = semantic stmts (rstmts', notScopeErr, ls, (i+1))
   | isALetterInScope id ls  = semantic stmts (rstmts', letterErr, ls, (i+1))
   | otherwise               = semantic stmts (rstmts', errs, ls, (i+1)) 
   where rstmts'     = rstmts ++ [(VarDrank newid)]
         notScopeErr   = errs ++ [NotMentionedVar id]
         letterErr     = errs ++ [LetterDrinking id]
         newid         = lookupGlobalId id ls



semantic ((Conditional mexp s1 s2):stmts) (rstmts, errs, ls, i)
   = semantic stmts ((rstmts ++ [(Conditional mexpnew rstmts1 rstmts2)]), errs2, ls, k)
   where (mexpnew, errsmexp) = mexpSemantic mexp (errs, ls)
         (rstmts1, errs1, l1, j) = semantic s1 ([], errsmexp, []:ls, i)
         (rstmts2, errs2, l2, k) = semantic s2 ([], errs1, []:ls, j)


semantic ((Eventually mexp loopstmts):stmts) (rstmts, errs, ls, i)   
   = semantic stmts ((rstmts ++ [(Eventually mexpnew rstmts')]), errs2, ls, j)
   where (mexpnew, errs1) = mexpSemantic mexp (errs, ls)
         (rstmts', errs2, _, j) = semantic loopstmts ([], errs1, []:ls, i)


{-----------------------------------------------------}
{-----------------INPUT NUMBER SEMANTICS -------------}
{-----------------------------------------------------}

semantic ((InputNumber id):stmts) (rstmts, errs, ls, i)
   | notInScope id ls        = semantic stmts (rstmts', errs', ls, i)
   | otherwise               = semantic stmts (rstmts', errs, ls, i) 
   where rstmts'       = rstmts ++ [(InputNumber rid)]
         errs'   = errs ++ [NotMentionedVar rid]
         rid         = lookupGlobalId id ls


{-----------------------------------------------------}
{-------------------SPOKE SEMANTICS ------------------}
{-----------------------------------------------------}


semantic ((VarSpoke id):stmts) (rstmts, errs, ls, i) 
   | notInScope id ls        = semantic stmts (rstmts, notScopeErr, ls, i)
   | isANumberInScope id ls = semantic stmts (rstmtsNum, errs, ls, i)
   | isALetterInScope id ls = semantic stmts (rstmtsLet, errs, ls, i)
   | isASentenceInScope id ls = semantic stmts (rstmtsStr, errs, ls, i)
   | otherwise               = semantic stmts (rstmts, errs, ls, i) 
   where rstmtsNum           = rstmts ++ [(NumberVarSpoke rid)]
         rstmtsLet           = rstmts ++ [(LetterVarSpoke rid)]
         rstmtsStr           = rstmts ++ [(SentenceVarSpoke rid)]
         notScopeErr         = errs ++ [NotMentionedVar id]
         rid                 = lookupGlobalId id ls


semantic ((MExpSpoke mexp):stmts) (rstmts, errs, ls, i) 
   = semantic stmts (rstmts', errsmexp, ls, i) 
   where (mexp', errsmexp) = mexpSemantic mexp (errs, ls)
         rstmts' = rstmts ++ [(MExpSpoke mexp')]

semantic ((LetterSpoke c):stmts) (rstmts, errs, ls, i) 
   = semantic stmts (rstmts', errs, ls, i) 
   where rstmts' = rstmts ++ [(LetterSpoke c)]

semantic ((SentenceSpoke str):stmts) (rstmts, errs, ls, i) 
   = semantic stmts (rstmts', errs, ls, i) 
   where rstmts' = rstmts ++ [(SentenceSpoke str)]


semantic ((RoomCallSpoke (RoomCall id args)):stmts) (rstmts, errs, ls, i)
   | notInScope id ls = (rstmts, errsScope, ls, i)
--   | wrongRoomCallParams id args = (rstmts', errsWrongParam, ls, i)
   | isANumberRoomInScope id ls  = semantic stmts (rstmts1, errs, ls, i)
   | isALetterRoomInScope id ls  = semantic stmts (rstmts2, errs, ls, i)
   | isASentenceRoomInScope id ls  = semantic stmts (rstmts3, errs, ls, i)
   | otherwise = semantic stmts (rstmts, errs, ls, i)

   where rid = lookupGlobalId id ls
         (rargs, errs') = argsSemantic args ls ([], errs) 
         rstmts1 = rstmts ++ [NumberRoomCallSpoke (RoomCall rid rargs)]
         rstmts2 = rstmts ++ [LetterRoomCallSpoke (RoomCall rid rargs)]
         rstmts3 = rstmts ++ [SentenceRoomCallSpoke (RoomCall rid rargs)]
         errsScope = errs ++ [NotMentionedVar id]


{-----------------------------------------------------}
{-------------------FOUND SEMANTICS ------------------}
{-----------------------------------------------------}


semantic ((AliceFoundMExp mexp):stmts) (rstmts, errs, ls, i) 
   = semantic stmts (rstmts', errs', ls, i)
   where (mexp', errs') = mexpSemantic mexp (errs, ls)
         rstmts' = rstmts ++ [(AliceFoundMExp mexp')]

semantic ((AliceFoundVar id):stmts) (rstmts, errs, ls, i)
   | notInScope id ls        = semantic stmts (rstmts, errsScope, ls, i)
   | isANumberInScope id ls  = semantic stmts (rstmts1, errs, ls, i)
   | isALetterInScope id ls  = semantic stmts (rstmts2, errs, ls, i)
   | isASentenceInScope id ls = semantic stmts (rstmts3, errs, ls, i)
   | otherwise               = semantic stmts (rstmts, errs, ls, i) 
   where rstmts1   = rstmts ++ [(AliceFoundVar rid)]
         rstmts2   = rstmts ++ [(AliceFoundVar rid)]
         rstmts3   = rstmts ++ [(AliceFoundVar rid)]
         errsScope = errs ++ [NotMentionedVar id]
         rid       = lookupGlobalId id ls


semantic ((AliceFoundLetter c):stmts) (rstmts, errs, ls, i)
   = semantic stmts (rstmts', errs, ls, i) 
   where rstmts' = rstmts ++ [(AliceFoundLetter c)]

semantic ((AliceFoundSentence str):stmts) (rstmts, errs, ls, i)
   = semantic stmts (rstmts', errs, ls, i) 
   where rstmts' = rstmts ++ [(AliceFoundSentence str)]


semantic ((AliceFoundRoomCall (RoomCall id args)):stmts) (rstmts, errs, ls, i)
   | notInScope id ls = semantic stmts (rstmts, errsScope, ls, i)
   | otherwise = semantic stmts (rstmts', errs', ls, i)
   where rid = lookupGlobalId id ls
         rstmts' = rstmts ++ [(AliceFoundRoomCall (RoomCall rid rargs))]
         (rargs, errs') = argsSemantic args ls ([], errs) 
         errsScope = errs ++ [NotMentionedVar id]



{-------------------------------------------------------------------}


mexpSemantic :: MExp -> ([SemanticError], [LocalScopeTable]) -> (MExp, [SemanticError])
mexpSemantic (IntLit x) (err, _) = (IntLit x, err)
mexpSemantic (MExpVar id) (err, ls)
   | notInScope id ls = ((MExpVar rid), (err ++ [NotMentionedVar id]))    
   | isALetterInScope id ls = ((MExpVar rid), (err ++ [LetterVarInMExp id])) 
-- | isASentenceInScope id (l:ls) = ((MExpVar rid), (err ++ [LetterVarInMExp id]))    
   | otherwise = ((MExpVar rid), err)
   where rid = lookupGlobalId id ls


mexpSemantic (Plus e1 e2) (err, ls) = ((Plus mexp1 mexp2), err2)
    where (mexp1, err1) = mexpSemantic e1 (err, ls)
          (mexp2, err2) = mexpSemantic e2 (err1, ls)

mexpSemantic (Minus e1 e2) (err, ls) = ((Minus mexp1 mexp2), err2)
    where (mexp1, err1) = mexpSemantic e1 (err, ls)
          (mexp2, err2) = mexpSemantic e2 (err1, ls)

mexpSemantic (Mult e1 e2) (err, ls) = ((Mult mexp1 mexp2), err2)
    where (mexp1, err1) = mexpSemantic e1 (err, ls)
          (mexp2, err2) = mexpSemantic e2 (err1, ls)

mexpSemantic (Div e1 e2) (err, ls) = ((Div mexp1 mexp2), err2)
    where (mexp1, err1) = mexpSemantic e1 (err, ls)
          (mexp2, err2) = mexpSemantic e2 (err1, ls)

mexpSemantic (Mod e1 e2) (err, ls) = ((Mod mexp1 mexp2), err2)
    where (mexp1, err1) = mexpSemantic e1 (err, ls)
          (mexp2, err2) = mexpSemantic e2 (err1, ls)

mexpSemantic (BitAnd e1 e2) (err, ls) = ((BitAnd mexp1 mexp2), err2)
    where (mexp1, err1) = mexpSemantic e1 (err, ls)
          (mexp2, err2) = mexpSemantic e2 (err1, ls)

mexpSemantic (BitOr e1 e2) (err, ls) = ((BitAnd mexp1 mexp2), err2)
    where (mexp1, err1) = mexpSemantic e1 (err, ls)
          (mexp2, err2) = mexpSemantic e2 (err1, ls)

mexpSemantic (BitXor e1 e2) (err, ls) = ((BitAnd mexp1 mexp2), err2)
    where (mexp1, err1) = mexpSemantic e1 (err, ls)
          (mexp2, err2) = mexpSemantic e2 (err1, ls)

mexpSemantic (BitNot e1) (err, ls) = ((BitNot mexp1), err1)
    where (mexp1, err1) = mexpSemantic e1 (err, ls)

mexpSemantic (Negate e1) (err, ls) = ((Negate mexp1), err1)
    where (mexp1, err1) = mexpSemantic e1 (err, ls)

mexpSemantic (LogAnd e1 e2) (err, ls) = ((LogAnd mexp1 mexp2), err2)
    where (mexp1, err1) = mexpSemantic e1 (err, ls)
          (mexp2, err2) = mexpSemantic e2 (err1, ls)

mexpSemantic (LogOr e1 e2) (err, ls) = ((LogOr mexp1 mexp2), err2)
    where (mexp1, err1) = mexpSemantic e1 (err, ls)
          (mexp2, err2) = mexpSemantic e2 (err1, ls)

mexpSemantic (LessThan e1 e2) (err, ls) = ((LessThan mexp1 mexp2), err2)
    where (mexp1, err1) = mexpSemantic e1 (err, ls)
          (mexp2, err2) = mexpSemantic e2 (err1, ls)

mexpSemantic (LessThanEq e1 e2) (err, ls) = ((LessThanEq mexp1 mexp2), err2)
    where (mexp1, err1) = mexpSemantic e1 (err, ls)
          (mexp2, err2) = mexpSemantic e2 (err1, ls)

mexpSemantic (GreaterThan e1 e2) (err, ls) = ((GreaterThan mexp1 mexp2), err2)
    where (mexp1, err1) = mexpSemantic e1 (err, ls)
          (mexp2, err2) = mexpSemantic e2 (err1, ls)

mexpSemantic (GreaterThanEq e1 e2) (err, ls) = ((GreaterThanEq mexp1 mexp2), err2)
    where (mexp1, err1) = mexpSemantic e1 (err, ls)
          (mexp2, err2) = mexpSemantic e2 (err1, ls)

mexpSemantic (LogNot e1) (err, ls) = ((LogNot mexp1), err1)
    where (mexp1, err1) = mexpSemantic e1 (err, ls)

mexpSemantic (Equals e1 e2) (err, ls) = ((Equals mexp1 mexp2), err2)
    where (mexp1, err1) = mexpSemantic e1 (err, ls)
          (mexp2, err2) = mexpSemantic e2 (err1, ls)

mexpSemantic (NotEquals e1 e2) (err, ls) = ((NotEquals mexp1 mexp2), err2)
    where (mexp1, err1) = mexpSemantic e1 (err, ls)
          (mexp2, err2) = mexpSemantic e2 (err1, ls)


mexpSemantic (MExpRoomCall (RoomCall id args)) (errs, ls) 
   | notInScope id ls = (MExpRoomCall ((RoomCall rid rargs)), errsScope)
   | otherwise = ((MExpRoomCall (RoomCall rid rargs)), errs')
   where errsScope = errs ++ [NotMentionedVar id]
         rid = lookupGlobalId id ls
         (rargs, errs') = argsSemantic args ls ([], errs)


argsSemantic :: [Argument] -> [LocalScopeTable] -> ([Argument], [SemanticError]) -> ([Argument], [SemanticError])
argsSemantic [] ls (rargs, errs) = (rargs, errs)
argsSemantic ((MExpArg mexp):args) ls (rargs, errs) = argsSemantic args ls (rargs', errs')
    where (rmexp, errs') = mexpSemantic mexp (errs, ls)
          rargs' = rargs ++ [(MExpArg rmexp)]


