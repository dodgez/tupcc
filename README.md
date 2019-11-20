# tupcc
This is an interpreter for a LISP inspired programming language called `tuple`.
- To run a file, pass it as an argument to `npm start` or `node index.js`.
- To run in interactive mode, pass the `-i` or `--interactive` flag.

If you would like to run a file and interactively run code afterwards, follow both of the above instructions.

The following is a short description of the syntax of the language.
To see some more example code, look at the `examples/` directory.
- Define a variable `(define test 1)`
- Change a variable `(set test 2)` (different from `define` to help prevent the issue noted below about lack of variable shadowing)
- Evaluate basic operations `(+ 1 2)`
- Print a value `(print (+ 1 2))`
- Create a function `(lambda (a b) ( {expressions that get evaluated} ))`
- Name a function `(define sum (lambda (a b) ( (+ a b) )))`
- Call a defined function `(sum a b)`
- Conditional execution `(if {cond} ( {exprs if true} ) ( {exprs if false} ))`
- Create a list `(tuple 1 2 3)`
- Loop `(while {cond} ( {expressions that get evaluated} ))`
