const fs = require('fs');
const lngr = require('lngr');
const prettier = require('prettier');
const program = require('commander');
const readline = require('readline');

const grammar = require("./grammar.json");
const package = require('./package.json');

const compile = require('./src/compile');
const run = require("./src/run");

const tokens = lngr.lexer.formatTokens(grammar.tokens);
const rules = lngr.parser.formatRules(grammar.rules);
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let input_file;
let code;

program.version(package.version)
  .arguments('[input file]')
  .option('-i, --interactive', 'run in interactive mode')
  .option('-c, --compile', 'compile the input file')
  .option('-o, --output <output_file>', 'specify the output compiled file', './a.js')
  .action(function(file) {
    input_file = file;
  });

program.parse(process.argv);

if (program.interactive && program.compile) {
  console.error('Interactive and compile mode are mutually exclusive.');
  process.exit(1);
}

if (!program.interactive || (program.interactive && typeof(input_file) !== 'undefined')) {
  if (typeof(input_file) === 'undefined') {
    console.error('No input file specified!');
    process.exit(1);
  }

  if (!fs.existsSync(input_file)) {
    console.error('Input file does not exist!');
    process.exit(1);
  }

  if (fs.lstatSync(input_file).isDirectory()) {
    console.error('Input is not a file!');
    process.exit(1);
  }

  code = fs.readFileSync(input_file, 'utf8') + '\n';
}

let vars = {};

function runCode(line) {
  let token_stream = lngr.utils.getTokenStream(lngr.lexer.lex(tokens, lngr.utils.getStringStream(line)));
  let tree = lngr.parser.parse(rules, token_stream);
  let stdout = run(tree, vars);
  if (stdout && stdout.length > 0) console.log(stdout.join("\n"));
}

if (code) {
  if (program.compile) {
    let token_stream = lngr.utils.getTokenStream(lngr.lexer.lex(tokens, lngr.utils.getStringStream(code)));
    let tree = lngr.parser.parse(rules, token_stream);
    let output_code = compile(tree);
    let formatted_code = prettier.format(output_code, {parser: "babel"});
    fs.writeFileSync(program.output, formatted_code);
  } else {
    runCode(code);
  }
}

if (!program.interactive) process.exit(0);

let continuing = false;
let continued_line = "";

rl.prompt();
rl.on('line', line => {
  if (line.endsWith("\\")) {
    if (!continuing) continued_line = "";
    continued_line += (continuing ? ' \n' : '') + line.slice(0, line.length - 1);
    continuing = true;
    rl.prompt();
    return;
  } else {
    if (continuing) {
      continued_line += ' \n' + line;
    } else {
      continued_line = line;
    }
    continuing = false;
  }

  try {
    runCode(continued_line);
  } catch (e) {
    console.error(e.message);
  }
  rl.prompt();
}).on('SIGINT', () => {
  console.log("^C");
  process.exit(0);
});
