const { expectNChildren } = require('./utils');

function compile(tree) {
  return tree.children.map(tryCompile).join(";\n");
}

function compileExpression(tree) {
  let expression_type = tree.children[1].type;
  switch (expression_type) {
    case "if_statement":
      return compileIfStatement(tree);
    case "while_statement":
      return compileWhileStatement(tree);
    case "function_definition":
      return compileFunction(tree);
    case "function_call":
      return compileFunctionCall(tree);
    default:
      throw new Error(`Unknown expression type '${expression_type}`);
  }
}

function compileIfStatement(tree) {
  let code = '';
  let if_node = tree.children[1];
  let cond = tryCompile(if_node.children[1]);
  code += `${cond} ? `;

  let true_node = if_node.children[2];
  let true_code = 0;
  if (true_node.type === "wrapped_expression") {
    let true_exprs = true_node.children.slice(1, true_node.children.length - 1);
    true_exprs = true_exprs.map(tryCompile);
    if (true_exprs.length > 0) {
      true_code = `(function() {${true_exprs.slice(0, true_exprs.length - 1).join(';')}` + (true_exprs.length > 1 ? `;` : ``) + `return ${true_exprs[true_exprs.length - 1]};})()`;
    } else {
      true_code = `(function() {})()`;
    }
  } else {
    true_code = tryCompile(true_node);
  }

  code += `${true_code} : `;

  let false_node = if_node.children[3];
  let false_code = 0;
  if (false_node.type === "wrapped_expression") {
    let false_exprs = false_node.children.slice(1, false_node.children.length - 1);
    false_exprs = false_exprs.map(tryCompile);
    if (false_exprs.length > 0) {
      false_code = `(function() {${false_exprs.slice(0, false_exprs.length - 1).join(';')}` + (false_exprs.length > 1 ? `;` : ``) + `return ${false_exprs[false_exprs.length - 1]};})()`;
    } else {
      false_code = `(function() {})()`;
    }
  } else {
    false_code = tryCompile(false_node);
  }
  
  return code + false_code;
}

function compileWhileStatement(tree) {
  let code = '';
  let while_node = tree.children[1];
  let cond = tryCompile(while_node.children[1]);
  code += `while (${cond}) {`;

  let exprs = while_node.children.slice(2);
  exprs = exprs.map(tryCompile);

  code += exprs.slice(0, exprs.length - 1).join(';') + (exprs.length > 1 ? `;` : ``) + exprs[exprs.length - 1] + '}';

  return code;
}

function compileFunction(tree) {
  let code = '';
  let function_node = tree.children[1];
  let args = function_node.children.slice(2, function_node.children.findIndex(child => child.type === "RPAREN"));
  code = `function(${args.map(tryCompile).join(', ')}) {`;

  let exprs = function_node.children.slice(function_node.children.findIndex(child => child.type === "RPAREN") + 1);
  exprs = exprs.map(tryCompile);

  code += exprs.slice(0, exprs.length - 1).join(';') + (exprs.length > 1 ? `;` : ``) + `return ${exprs[exprs.length - 1]};}`;

  return code;
}

function compileFunctionCall(tree) {
  let function_node = tree.children[1];
  let function_call_type = function_node.children[0].type;

  if (function_call_type === "OPERATION") {
    return compileFunctionCallOperation(function_node);
  } else if (function_call_type === "IDENTIFIER") {
    return compileFunctionCallIdentifier(function_node);
  }
}

function compileFunctionCallOperation(tree) {
  let function_name = tree.children[0].token;
  let args = tree.children.slice(1).map(tryCompile);

  return args.join(function_name);
}

function compileFunctionCallIdentifier(tree) {
  let function_name = tree.children[0].token;
  let args = tree.children.slice(1).map(tryCompile);

  switch (function_name) {
    case "print":
      return `console.log(${args.join(', ')})`;
    case "set":
    case "define":
      expectNChildren(tree, 3);
      return `${args[0]} = ${args[1]}`;
    case "pow":
      expectNChildren(tree, 3);
      return args.join('**');
    case "not":
      expectNChildren(tree, 2);
      return `!${args[0]}`;
    case "and":
      expectNChildren(tree, 2);
      return args.join('&&');
    case "or":
      expectNChildren(tree, 2);
      return args.join('||');
    case "eq":
      expectNChildren(tree, 2);
      return args.join('==');
    case "neq":
      expectNChildren(tree, 2);
      return args.join('!=');
    case 'lt':
      expectNChildren(tree, 2);
      return args.join('<');
    case 'lte':
      expectNChildren(tree, 2);
      return args.join('<=');
    case 'gt':
      expectNChildren(tree, 2);
      return args.join('>');
    case 'gte':
      expectNChildren(tree, 2);
      return args.join('>=');
    case 'tuple':
      return `[${args.join(', ')}]`;
    case 'is_tuple':
      return `["string", "object"].includes(typeof(${args[0]}))`;
    case 'head':
      return `${args[0]}[0]`;
    case 'tail':
      return `${args[0]}.slice(1)`;
    case 'len':
      return `${args[0]}.length`;
    case 'cat':
      return `${args[0]}.concat(${args[1]})`;
    case 'ret':
      return `${args[0]}`;
    case 'tupleToStr':
      return `${args[0]}.join('')`;
    case 'strToTuple':
      return `${args[0]}.split('')`;
    default:
      return `${function_name}(${args.join(', ')})`;
  }
}

function tryCompile(tree) {
  switch(tree.type) {
    case "expression":
      return `${compileExpression(tree)}`;
    case "IDENTIFIER":
      return tree.token;
    case "number":
      let integer_part = tree.children[0].token;
      let float = tree.children.length > 1;
      let float_part;
      if (float) float_part = tree.children[1].children[1].token;
      return parseFloat(`${integer_part}${float ? `.${float_part}` : ""}`);
    case "string":
      let str = tree.children[0].token.slice(1).replace('"', '');
      return `"${str}"`;
    case "BOOLEAN":
      return tree.token;
    default:
      throw new Error(`Unexpected type to compile ${tree.type}`);
  }
}

module.exports = compile;
