--------------------------------------------------------------------------------
                        BUILDING THE MALICE COMPILER
--------------------------------------------------------------------------------
In the directory, type 
make

Happy and Alex are recommended but not required.
The ghc compiler is required.

Running make clean will undo changes.
If you have Alex and Happy,
make hardclean
will remove the files produced by these programs. Do not run this command if you
don't have Happy and Alex.

--------------------------------------------------------------------------------
                          COMPILING MALICE PROGRAMS
--------------------------------------------------------------------------------
Compile using 
./compile FILENAME.malice
The executable produced is run by executing
./FILENAME

nasm and gcc are required for compilation.
