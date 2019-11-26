const expect = require('chai').expect;
const fs = require('fs');
const lngr = require('lngr');
const sinon = require('sinon');

const compile = require('../src/compile.js');
const grammar = require("../grammar.json");

describe('Compiles', function() {
  let tokens;
  let rules;

  before(function() {
    tokens = lngr.lexer.formatTokens(grammar.tokens);
    rules = lngr.parser.formatRules(grammar.rules);
    sinon.createSandbox();
  });

  function getCode(filename) {
    if (!fs.existsSync(filename)) {
      throw new Error(`File ${filename} does not exist!`);
    }

    let code = fs.readFileSync(filename, 'utf8');
    let token_stream = lngr.utils.getTokenStream(lngr.lexer.lex(tokens, lngr.utils.getStringStream(code)));
    let tree = lngr.parser.parse(rules, token_stream);
    let compiled = compile(tree);
    return compiled;
  }

  afterEach(function() {
    sinon.restore();
  });

  it('fibonacci', function() {
    let stub = sinon.stub(console, "log");
    let code = getCode('./examples/fibonacci.tu');
    Function(code)();

    expect(stub.callCount).to.equal(2);
    expect(stub.getCall(0).args).to.deep.equal([[1,1,2,3,5,8,13,21,34,55,89,144,233]]);
    expect(stub.getCall(1).args).to.deep.equal([[1,2,3,5,8,13,21,34,55,89,144,233,377]]);
  });

  it('forIn', function() {
    let stub = sinon.stub(console, "log");
    let code = getCode('./examples/forIn.tu');
    Function(code)();

    expect(stub.callCount).to.equal(1);
    expect(stub.getCall(0).args).to.deep.equal([[2,3,4]]);
  });

  it('indexOf', function() {
    let stub = sinon.stub(console, "log");
    let code = getCode('./examples/indexOf.tu');
    Function(code)();

    expect(stub.callCount).to.equal(3);
    expect(stub.getCall(0).args).to.deep.equal([1]);
    expect(stub.getCall(1).args).to.deep.equal([7]);
    expect(stub.getCall(2).args).to.deep.equal([-1]);
  });

  it('last', function() {
    let stub = sinon.stub(console, "log");
    let code = getCode('./examples/last.tu');
    Function(code)();

    expect(stub.callCount).to.equal(2);
    expect(stub.getCall(0).args).to.deep.equal([5]);
    expect(stub.getCall(1).args).to.deep.equal([5]);
  });

  it('partition', function() {
    let stub = sinon.stub(console, "log");
    let code = getCode('./examples/partition.tu');
    Function(code)();

    expect(stub.callCount).to.equal(1);
    expect(stub.getCall(0).args).to.deep.equal([451]);
  });

  it('range', function() {
    let stub = sinon.stub(console, "log");
    let code = getCode('./examples/range.tu');
    Function(code)();

    expect(stub.callCount).to.equal(2);
    expect(stub.getCall(0).args).to.deep.equal([[2,3,4,5,6,7,8,9]]);
    expect(stub.getCall(1).args).to.deep.equal([[]]);
  });

  it('reverse', function() {
    let stub = sinon.stub(console, "log");
    let code = getCode('./examples/reverse.tu');
    Function(code)();

    expect(stub.callCount).to.equal(2);
    expect(stub.getCall(0).args).to.deep.equal([[3,2,1]]);
    expect(stub.getCall(1).args).to.deep.equal(["!dlroW ,olleH"]);
  });

  it('runJS', function() {
    let stub = sinon.stub(console, "log");
    let code = getCode('./examples/runJS.tu');
    eval(code);

    expect(stub.callCount).to.equal(2);
    expect(stub.getCall(0).args).to.deep.equal(["\"Hello, World!\" from JavaScript"]);
    expect(stub.getCall(1).args).to.deep.equal(["\"Hello, World!\" from JavaScript"]);
  });

  it('slice', function() {
    let stub = sinon.stub(console, "log");
    let code = getCode('./examples/slice.tu');
    Function(code)();


    expect(stub.callCount).to.equal(2);
    expect(stub.getCall(0).args).to.deep.equal([[2,3]]);
    expect(stub.getCall(1).args).to.deep.equal([[]]);
  });
});
