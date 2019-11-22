const { expectNChildren } = require('./utils');

function compile(tree) {
  return tree.children.map(tryCompile).map(line => line.endsWith(';') ? line : line+';').join('');
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

function compileIfStatement(tree, force_ternary=false) {
  let code = '';
  let if_node = tree.children[1];
  let cond = tryCompile(if_node.children[1]);
  let ternary = !(if_node.parent.type === 'expression' && (if_node.parent.parent.type === 'program') || (if_node.parent.parent.type === 'function_definition'));
  if (if_node.children[2].type !== "wrapped_expression") ternary = true;
  if (if_node.children[3].type !== "wrapped_expression") ternary = true;
  ternary = ternary || force_ternary;
  if (ternary) {
    code += `((${cond}) ? `;
  } else {
    code += `if (${cond}) {`;
  }

  let true_node = if_node.children[2];
  let true_code = 0;
  if (true_node.type === "wrapped_expression") {
    let true_exprs = true_node.children.slice(1, true_node.children.length - 1);
    true_exprs = true_exprs.map(tryCompile);
    if (true_exprs.length > 0) {
      true_code = ternary ? `(${true_exprs.join(',')})` : true_exprs.join(';');
    } else {
      true_code = ternary ? `undefined` : ``;
    }
  } else {
    true_code = tryCompile(true_node);
  }

  if (ternary) {
    code += `${true_code} : `;
  } else {
    code += `${true_code}} else {`;
  }

  let false_node = if_node.children[3];
  let false_code = 0;
  if (false_node.type === "wrapped_expression") {
    let false_exprs = false_node.children.slice(1, false_node.children.length - 1);
    false_exprs = false_exprs.map(tryCompile);
    if (false_exprs.length > 0) {
      false_code = ternary ? `(${false_exprs.join(',')})` : false_exprs.join(';');
    } else {
      false_code = ternary ? `undefined` : ``;
    }
  } else {
    false_code = tryCompile(false_node);
  }

  if (ternary) {
    code += `${false_code})`;
  } else {
    code += `${false_code}}`;
  }
  
  return code;
}

function compileWhileStatement(tree, force_ternary=false) {
  let code = '';
  let while_node = tree.children[1];
  let cond = tryCompile(while_node.children[1]);
  let ternary = !(while_node.parent.type === 'expression' && (while_node.parent.parent.type === 'program') || (while_node.parent.parent.type === 'function_definition'));
  ternary = ternary || force_ternary;
  let exprs = while_node.children.slice(2);
  exprs = exprs.map(tryCompile);

  if (ternary) {
    code += `(function(){let __value=0;while(${cond}) {${exprs.slice(0, exprs.length - 1).join(';')}${exprs.length>1?';':''}__value=${exprs[exprs.length - 1]};}return __value;})()`;
  } else {
    code += `while(${cond}) {${exprs.join(';')}}`;
  }

  return code;
}

function compileFunction(tree) {
  let code = '';
  let function_node = tree.children[1];
  let args = function_node.children.slice(2, function_node.children.findIndex(child => child.type === "RPAREN"));
  code = `function(${args.map(tryCompile).join(', ')}) {`;

  let exprs = function_node.children.slice(function_node.children.findIndex(child => child.type === "RPAREN") + 1);
  let expr_values = exprs.map(tryCompile);

  let last_expr = exprs.length > 0 ? exprs[exprs.length - 1] : null;
  if (last_expr) {
    if (last_expr.type === 'expression' && last_expr.children[1].type === 'if_statement') {
      expr_values[expr_values.length - 1] = compileIfStatement(last_expr, true);
    } else if (last_expr.type === 'expression' && last_expr.children[1].type === 'while_statement') {
      expr_values[expr_values.length - 1] = compileWhileStatement(last_expr, true);
    }
  }
  code += expr_values.slice(0, expr_values.length - 1).join(';');
  code += (expr_values.length > 1 ? `;` : ``);
  code += `return ${expr_values[expr_values.length - 1]}}`;

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
      return `Array.isArray(${args[0]})`;
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
