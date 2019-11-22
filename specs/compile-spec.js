const babel = require('@babel/core');
const expect = require('chai').expect;
const fs = require('fs');
const lngr = require('lngr');

const compile = require('../src/compile.js');
const grammar = require("../grammar.json");

describe('Compiles', function() {
  this.timeout("10s");

  let tokens;
  let rules;

  before(function() {
    tokens = lngr.lexer.formatTokens(grammar.tokens);
    rules = lngr.parser.formatRules(grammar.rules);
  });

  function getCode(filename) {
    if (!fs.existsSync(filename)) {
      throw new Error(`File ${filename} does not exist!`);
    }

    let code = fs.readFileSync(filename, 'utf8');
    let token_stream = lngr.utils.getTokenStream(lngr.lexer.lex(tokens, lngr.utils.getStringStream(code)));
    let tree = lngr.parser.parse(rules, token_stream);
    let compiled = compile(tree);
    let transformed = babel.transformSync(compiled);

    return transformed.code;
  }

  function compileCode(code) {
    let token_stream = lngr.utils.getTokenStream(lngr.lexer.lex(tokens, lngr.utils.getStringStream(code)));
    let tree = lngr.parser.parse(rules, token_stream);
    let compiled = compile(tree);

    return compiled;
  }

  it('function call', function() {
    let output = compileCode(`
      (define a 1)
      (print (+ a a))
    `);

    expect(output).to.equal(`a = 1;\nconsole.log(a+a)`);
  });

  it('if statement', function() {
    let output = compileCode(`
      (if (eq 1 1) 3 4)
    `);

    expect(output).to.equal(`1==1 ? 3 : 4`);

    output = compileCode(`
      (if (eq 1 1) (
        (print true)
      ) (
        (print false)
      ))
    `);

    expect(output).to.equal(`1==1 ? (function() {return console.log(true);})() : (function() {return console.log(false);})()`);
  });

  it('while statement', function() {
    let output = compileCode(`
      (while (eq 1 1) (print true))
    `);

    expect(output).to.equal(`while (1==1) {console.log(true)}`);
  });

  it('function definition', function() {
    let output = compileCode(`
      (lambda (x y) (+ x y) (- x y))
    `);

    expect(output).to.equal(`function(x, y) {x+y;return x-y;}`);

    output = compileCode(`
      (define sum (lambda (x y) (+ x y)))
    `);

    expect(output).to.equal(`sum = function(x, y) {return x+y;}`);
  });
});
