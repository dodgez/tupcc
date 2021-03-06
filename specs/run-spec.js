const expect = require('chai').expect;
const fs = require('fs');
const lngr = require('lngr');

const run = require('../src/run.js');
const grammar = require("../grammar.json");

describe('Runs', function() {
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

    return tree;
  }

  it('fibonacci', function() {
    const tree = getCode('examples/fibonacci.tu');
    const vars = {};

    expect(run(tree, vars)).to.deep.equal([
      "(tuple 1 1 2 3 5 8 13 21 34 55 89 144 233)",
      "(tuple 1 2 3 5 8 13 21 34 55 89 144 233 377)",
    ]);
  });

  it('forIn', function() {
    const tree = getCode('examples/forIn.tu');
    const vars = {};

    expect(run(tree, vars)).to.deep.equal([
      "(tuple 2 3 4)"
    ]);
  });

  it('indexOf', function() {
    const tree = getCode('examples/indexOf.tu');
    const vars = {};

    expect(run(tree, vars)).to.deep.equal([
      1,
      7,
      -1
    ]);
  });

  it('last', function() {
    const tree = getCode('examples/last.tu');
    const vars = {};

    expect(run(tree, vars)).to.deep.equal([
      5,
      5
    ]);
  });

  it('partition', function() {
    this.timeout("5s");
    const tree = getCode('examples/partition.tu');
    const vars = {};

    expect(run(tree, vars)).to.deep.equal([451]);
  });

  it('range', function() {
    const tree = getCode('examples/range.tu');
    const vars = {};

    expect(run(tree, vars)).to.deep.equal([
      "(tuple 2 3 4 5 6 7 8 9)",
      "(tuple )"
    ]);
  });

  it('reverse', function() {
    const tree = getCode('examples/reverse.tu');
    const vars = {};

    expect(run(tree, vars)).to.deep.equal([
      "(tuple 3 2 1)",
      "\"!dlroW ,olleH\""
    ]);
  });

  it('runJS', function() {
    const tree = getCode('examples/runJS.tu');
    const vars = {};

    expect(run(tree, vars)).to.deep.equal([
      "\"\"Hello, World!\" from JavaScript\"",
      "\"\"Hello, World!\" from JavaScript\""
    ]);
  });

  it('slice', function() {
    const tree = getCode('examples/slice.tu');
    const vars = {};

    expect(run(tree, vars)).to.deep.equal([
      "(tuple 2 3)",
      "(tuple )"
    ]);
  });
});
