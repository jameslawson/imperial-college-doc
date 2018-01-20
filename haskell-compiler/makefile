default:
	alex Scanner.x
	happy Parser.y 
	ghc -o compile TypeDefinitions.hs SemanticAnalyser.hs CodeGenerator.hs Scanner.hs Parser.hs
	clear

noparse:
	ghc -o compile TypeDefinitions.hs SemanticAnalyser.hs CodeGenerator.hs Scanner.hs Parser.hs
	clear
clean:
	rm -f assembly.asm
	rm -f *.hi
	rm -f *.o
	rm -f compile
	clear

hardclean:
	make clean
	rm -f Parser.hs Scanner.hs
