const prettyPrint = require('./print');
const { expectNChildren } = require('./utils');
const { findType, coerceBack, coerceValue, requireTrueOrFalse } = require('./type');

function runProgram(tree, vars) {
  let program_stdout = [];
  for (let child of tree.children) {
    prettyPrint(run(child, vars, program_stdout));
  }
  return program_stdout;
}

function runExpression(tree, vars, stdout) {
  expectNChildren(tree, 3);
  let expression_type = tree.children[1].type;
  switch (expression_type) {
    case "if_statement":
      return runIfStatement(tree, vars, stdout);
    case "while_statement":
      return runWhileStatement(tree, vars, stdout);
    case "function_definition":
      return tree.children[1];
    case "function_call":
      return runFunctionCall(tree, vars, stdout);
  }
}

function runIfStatement(tree, vars, stdout) {
  let if_node = tree.children[1];
  let cond = getValue(if_node.children[1], vars, stdout, "boolean");
  requireTrueOrFalse(cond);

  let new_tree = if_node.children[cond ? 2 : 3];
  if (new_tree.type === "wrapped_expression") {
    let exprs = new_tree.children.slice(1, new_tree.children.length - 1);
    exprs = exprs.map(expr => {
      return getValue(expr, vars, stdout);
    });
    return exprs.length > 0 ? exprs[exprs.length - 1] : 0;
  } else {
    return getValue(new_tree, vars, stdout);
  }
}

function runWhileStatement(tree, vars, stdout) {
  let while_node = tree.children[1];
  let cond = getValue(while_node.children[1], vars, stdout, "boolean");
  requireTrueOrFalse(cond);
  let last_value_found = 0;
  let exprs = while_node.children.slice(2, while_node.children.length);
  let exprs_values;

  while (cond) {
    exprs_values = exprs.map(expr => {
      let value = getValue(expr, vars, stdout);
      return value;
    });

    last_value_found = exprs_values.length > 0 ? exprs_values[exprs_values.length - 1] : 0;
    cond = getValue(while_node.children[1], vars, stdout, "boolean");
    requireTrueOrFalse(cond);
  }

  return last_value_found;
}

function runFunctionCall(tree, vars, stdout) {
  let function_node = tree.children[1];
  let function_name = function_node.children[0].token;
  let function_call_type = function_node.children[0].type;
  if (function_call_type === "OPERATION") {
    expectNChildren(function_node, 3);
    let eval_str = getValue(function_node.children[1], vars, stdout, "number").toString();
    for (let child of function_node.children.slice(2, function_node.children.length)) {
      eval_str += function_name + getValue(child, vars, stdout, "number").toString();
    }
    return eval(eval_str);
  } else if (function_call_type === "IDENTIFIER") {
    let obj;
    let key;
    let key_type;
    let value;
    let first_value;
    switch (function_name) {
      case "requireRun":
        expectNChildren(function_node, 3);
        let module = require(getValue(function_node.children[1], vars, stdout, "string"));
        let func_name = getValue(function_node.children[2], vars, stdout, "string");
        let func_to_call = func_name ? module[func_name] : module;
        let args = function_node.children.slice(3).map(item => coerceValue(getValue(item, vars, stdout)));
        return coerceBack(func_to_call(...args));
      case "print":
        expectNChildren(function_node, 1);
        for (let child of function_node.children.slice(1)) {
          stdout.push(prettyPrint(getValue(child, vars, stdout)));
        }
        return function_node.children.length - 1 > 0 ? stdout[stdout.length - 1] : "";
      case "set":
      case "define":
        expectNChildren(function_node, 3);
        let new_var_name = function_node.children[1].token;
        if (function_name === "define" && vars.hasOwnProperty(new_var_name)) {
          throw new Error(`Identifier '${new_var_name}' is already defined`);
        } else if (function_name === "set" && !vars.hasOwnProperty(new_var_name)) {
          throw new Error(`Identifier '${new_var_name}' is not defined`);
        }
        let new_value = getValue(function_node.children[2], vars, stdout);
        let new_type = findType(new_value);
        vars[new_var_name] = {
          name: new_var_name,
          value: new_value,
          type: new_type
        };
        return new_value;
      case "pow":
        expectNChildren(function_node, 2);
        value = getValue(function_node.children[1], vars, stdout, "number");
        for (let child of function_node.children.slice(2)) {
          value = value ** getValue(child, vars, stdout, "number");
        }
        return value;
      case "not":
        expectNChildren(function_node, 2);
        value = getValue(function_node.children[1], vars, stdout);
        requireTrueOrFalse(value);
        return !value;
      case "and":
        expectNChildren(function_node, 2);
        value = true;
        for (let child of function_node.children.slice(1)) {
          let new_value = getValue(child, vars, stdout);
          requireTrueOrFalse(new_value);
          value = value && new_value;
        }
        return value;
      case "or":
        expectNChildren(function_node, 2);
        value = false;
        for (let child of function_node.children.slice(1)) {
          let new_value = getValue(child, vars, stdout);
          requireTrueOrFalse(new_value);
          value = value || new_value;
        }
        return value;
      case "eq":
        expectNChildren(function_node, 2);
        first_value = getValue(function_node.children[1], vars, stdout);
        for (let child of function_node.children.slice(2)) {
          let new_value = getValue(child, vars, stdout);
          if (new_value !== first_value) {
            return false;
          }
        }
        return true;
      case "neq":
        expectNChildren(function_node, 2);
        first_value = getValue(function_node.children[1], vars, stdout);
        for (let child of function_node.children.slice(2)) {
          let new_value = getValue(child, vars, stdout);
          if (new_value !== first_value) {
            return true;
          }
        }
        return false;
      case "lte":
      case "lt":
        expectNChildren(function_node, 3);
        first_value = getValue(function_node.children[1], vars, stdout, "number");
        for (let child of function_node.children.slice(2)) {
          let new_value = getValue(child, vars, stdout, "number");
          if (new_value < first_value) {
            return false;
          } else if (new_value === first_value && function_name === "lt") {
            return false;
          }
        }
        return true;
      case "gte":
      case "gt":
        expectNChildren(function_node, 3);
        first_value = getValue(function_node.children[1], vars, stdout, "number");
        for (let child of function_node.children.slice(2)) {
          let new_value = getValue(child, vars, stdout, "number");
          if (new_value > first_value) {
            return false;
          } else if (new_value === first_value && function_name === "gt") {
            return false;
          }
        }
        return true;
      case "tuple":
        expectNChildren(function_node, 1);
        let tuple_items = function_node.children.slice(1);
        return tuple_items.map(item => getValue(item, vars, stdout));
      case "is_tuple":
        expectNChildren(function_node, 2);
        for (let tuple_option of function_node.children.slice(1)) {
          let type = findType(getValue(tuple_option, vars, stdout));
          if (type !== "tuple") {
            return false;
          }
        }
        return true;
      case "head":
        expectNChildren(function_node, 2);
        let heads = [];
        for (let tuple_option of function_node.children.slice(1)) {
          heads.push(getValue(tuple_option, vars, stdout, "tuple")[0]);
        }
        return heads.length === 1 ? heads[0] : heads;
      case "tail":
        expectNChildren(function_node, 2);
        let tails = [];
        for (let tuple_option of function_node.children.slice(1)) {
          tails.push(getValue(tuple_option, vars, stdout, "tuple").slice(1));
        }
        return tails.length === 1 ? tails[0] : tails;
      case "len":
        expectNChildren(function_node, 2);
        let lens = [];
        for (let tuple_option of function_node.children.slice(1)) {
          lens.push(getValue(tuple_option, vars, stdout, "tuple").length);
        }
        return lens.length === 1 ? lens[0] : lens;
      case "cat":
        expectNChildren(function_node, 2);
        let base_array = getValue(function_node.children[1], vars, stdout, "tuple").copyWithin();
        for (let child of function_node.children.slice(2)) {
          base_array = base_array.concat(getValue(child, vars, stdout, "tuple").copyWithin());
        }
        return base_array;
      case "tupleToStr":
        expectNChildren(function_node, 2);
        value = [];
        for (let child of function_node.children.slice(1)) {
          let broken_string = getValue(child, vars, stdout, "tuple");
          value.push(broken_string.join(''));
        }
        return value.length === 1 ? value[0] : value;
      case "strToTuple":
        expectNChildren(function_node, 2);
        value = [];
        for (let child of function_node.children.slice(1)) {
          value.push(getValue(child, vars, stdout, "string").split(''));
        }
        return value.length === 1 ? value[0] : value;
      case "obj":
        obj = {};
        for (let child of function_node.children.slice(1)) {
          let key_value = getValue(child, vars, stdout, "tuple");
          let key_type = findType(key_value[0]);
          if (key_type !== 'string' && key_type !== 'number') {
            throw new Error(`Expected key type of string or number but got ${key_type}`);
          }

          obj[key_value[0]] = key_value[1];
        }
        return obj;
      case "getValue":
        obj = getValue(function_node.children[1], vars, stdout, "object");
        key = getValue(function_node.children[2], vars, stdout, "string");
        key_type = findType(key);
        if (key_type !== 'string' && key_type !== 'number') {
          throw new Error(`Expected key type of string or number but got ${key_type}`);
        }
        return obj[key];
      case "setValue":
        obj = getValue(function_node.children[1], vars, stdout, "object");
        key = getValue(function_node.children[2], vars, stdout, "string");
        key_type = findType(key);
        if (key_type !== 'string' && key_type !== 'number') {
          throw new Error(`Expected key type of string or number but got ${key_type}`);
        }
        value = getValue(function_node.children[3], vars, stdout);
        obj[key] = value;
        return obj[key];
      case "ret":
        expectNChildren(function_node, 2);
        return getValue(function_node.children[1], vars, stdout);
      default:
        function_node = getValue(function_node.children[0], vars, stdout, "function");
        break;
    }
  } else if (function_call_type === "wrapped_function_definition") {
    function_node = function_node.children[0].children[1];
  }

  let var_names = function_node.children.slice(2, function_node.children.findIndex(child => child.type === "RPAREN"));
  let args = tree.children[1].children.slice(1);

  if (var_names.length !== args.length) {
    throw new Error(`Function expects ${var_names.length} arguments but ${args.length} ${args.length === 1 ? "is" : "are"} passed`);
  }

  let new_vars = Object.assign({}, vars);
  var_names.forEach((var_name, i) => {
    let value = getValue(args[i], vars, stdout);
    new_vars[var_name.token] = {
      value,
      type: findType(value),
      name: var_name.token
    };
  });
  vars = new_vars;

  let function_exprs = function_node.children.slice(function_node.children.findIndex(child => child.type === "RPAREN") + 1);

  function_exprs = function_exprs.map(function_expr => {
    return getValue(function_expr, vars, stdout);
  });

  return function_exprs.length > 0 ? function_exprs[function_exprs.length - 1] : 0;
}

function getValue(tree, vars, stdout, force_type) {
  switch (tree.type) {
    case "number":
      if (force_type && force_type !== "number") {
        throw new Error(`Expected type '${force_type}' but got type 'number'`);
      }
      let integer_part = tree.children[0].token;
      let float = tree.children.length > 1;
      let float_part;
      if (float) float_part = tree.children[1].children[1].token;
      return parseFloat(`${integer_part}${float ? `.${float_part}` : ""}`);
    case "IDENTIFIER":
      if (!vars.hasOwnProperty(tree.token)) {
        throw new Error(`Identifier '${tree.token}' is not defined`);
      }

      if (force_type && vars[tree.token].type !== force_type) {
        throw new Error(`Expected type '${force_type}' but got type '${vars[tree.token].type}'`);
      }
      
      return vars[tree.token].value;
    case "BOOLEAN":
      if (force_type && force_type !== "boolean") {
        throw new Error(`Expected type '${force_type}' but got type 'boolean'`);
      }
      return tree.token === "true" ? true : false;
    case "expression":
      let value = run(tree, vars, stdout);
      let type = findType(value);
      if (force_type && force_type !== type) {
        throw new Error(`Expected type '${force_type}' but got type '${type}'`);
      }
      return value;
    case "string":
      if (force_type && force_type !== "string") {
        throw new Error(`Expected type '${force_type}' but got type 'string'`);
      }
      return tree.children[0].token.slice(1).replace('"', '');
    default:
      throw new Error(`Cannot get value for type '${tree.type}'`);
  }
}

function run(tree, vars, stdout = []) {
  switch (tree.type) {
    case "program":
      return runProgram(tree, vars);
    case "expression":
      return runExpression(tree, vars, stdout);
  }
}

module.exports = run;
