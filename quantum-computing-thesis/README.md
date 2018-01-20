# mbqsee (angular.js)

MEng Computing Thesis Project    
Measurement Based Quantum Computing

This project is a visual tool to aid the research in Quantum Computing.
Written in Angular.js 1.0 in 2014.    
It allows a user to input a so-called _Measurement Calculus_ instruction sequence
and to simulate the execution on a Measurement-based Quantum Computer.

My Thesis Paper: [report.pdf](https://github.com/jameslawson/mbqsee-angular/blob/master/report.pdf)

More info:    
_Measurement Calculus_: http://arxiv.org/abs/quant-ph/0412135    
_Measurement-based Quantum Computer_: http://arxiv.org/abs/quant-ph/0508124, http://arxiv.org/abs/0910.1116

## Features

A custom-made **equation editor** (an IME) to input the Measurement Calculus. A user can input an equation and use the arrow keys (or buttons) to navigate through various placeholders to complete the desired equation.  
![Screenshot of IME](http://i.imgur.com/aPqnqx0.png?1)


Correct **simulation** of the instructions. Working out the Qunatum State is tedious to do by hand mathematically.
For example, if your machine has 5 qubits, then for _each instruction_, you need 
to multiply a vector by a 32x32 matrix. With this program, you can do the same operation with a click of a button.
![Imgur](http://i.imgur.com/ZabyXGM.png)

Interactive **term-rewriting** of the instructions. The original paper describes the ability to move the instrucions around according to so-called [term rewriting rules](https://en.wikipedia.org/wiki/Rewriting#Term_rewriting_systems).
The tool shows you when rewriting rules can be applied (the small blue buttons) -- clicking the button applies the  rule to give a new rewritten (reorganized) instruction sequence. For any given rewrite step, the program highlights in blue what changed. 

![Imgur](http://i.imgur.com/Hx24yvd.png?1)    
Term rewriting is a pain to do on paper because instructions are long and unfortunately, very little changes per step a lot of steps are needed to get anything done. The result is that a given rewrite proof will have *very long lines* and have *many lines*. Typos are very easy to come by; the original paper itself had many typos in the sections that explained term rewriting.

## Installation

Requires Node.js and bower. 
Clone the repo and cd to the root of the project.
```
bower install
npm install
npm start
```
Open http://localhost:8000/app in your browser.



