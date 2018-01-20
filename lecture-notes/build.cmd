REM usage: build.cmd 144
REM %1 is name of module (eg: 144, m2p4, 499 etc..)
REM the output pdf is placed in the folder for the inputted module
cd %1
pdflatex -synctex=1 -interaction=nonstopmode "%1.tex"
cd ..
start "" "%~dp0\%1\%1.pdf"