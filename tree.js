function runTree(tree, vars, stdout) {
  function getValue(tree, force_type) {
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
        } else {
          if (force_type && vars[tree.token].type !== force_type) {
            throw new Error(`Expected type '${force_type}' but got type '${vars[tree.token].type}'`);
          }
          return vars[tree.token].value;
        }
        case "BOOLEAN":
          if (tree.token === "true") {
            return true;
          } else if (tree.token === "false") {
            return false;
          } else {
            throw new Error(`Expected boolean type but got '${tree.token}'`);
          }
          case "expression":
            let value = runTree(tree, vars, stdout);
            let type = findType(value);
            if (force_type && force_type !== type) {
              throw new Error(`Expected type '${force_type}' but got type '${type}'`);
            }
            return value;
          case "string":
            let str = tree.children[0].token.slice(1).replace('"', '').split('');
            return str.length === 1 ? str[0] : str;
          default:
            throw new Error(`Cannot get value for type '${tree.type}'`);
    }
  }

  switch (tree.type) {
    case "program":
      let program_stdout = [];
      for (let child of tree.children) {
        prettyPrint(runTree(child, vars, program_stdout));
      }
      if (program_stdout.length > 0) console.log(program_stdout.join("\n"));
      return;
    case "expression":
      expectNChildren(tree, 3);
      let expression_type = tree.children[1].type;
      let cond;
      switch (expression_type) {
        case "if_statement":
          let if_node = tree.children[1];
          cond = getValue(if_node.children[1], "boolean");
          requireTrueOrFalse(cond);

          let new_tree = if_node.children[cond ? 2 : 3];
          if (new_tree.type === "wrapped_expression") {
            let exprs = new_tree.children.slice(1, new_tree.children.length - 1);
            exprs = exprs.map(expr => {
              return getValue(expr);
            });
            return exprs.length > 0 ? exprs[exprs.length - 1] : 0;
          } else {
            return getValue(new_tree);
          }
          case "while_statement":
            let while_node = tree.children[1];
            cond = getValue(while_node.children[1], "boolean");
            requireTrueOrFalse(cond);
            let last_value_found = 0;
            let exprs = while_node.children.slice(2, while_node.children.length);
            let exprs_values;

            while (cond) {
              exprs_values = exprs.map(expr => {
                let value = getValue(expr);
                return value;
              });

              last_value_found = exprs_values.length > 0 ? exprs_values[exprs_values.length - 1] : 0;
              cond = getValue(while_node.children[1], "boolean");
              requireTrueOrFalse(cond);
            }

            return last_value_found;
          case "function_definition":
            return tree.children[1];
          case "function_call":
            let function_node = tree.children[1];
            let function_name = function_node.children[0].token;
            let function_call_type = function_node.children[0].type;
            if (function_call_type === "OPERATION") {
              expectNChildren(function_node, 3);
              let eval_str = getValue(function_node.children[1], "number").toString();
              for (let child of function_node.children.slice(2, function_node.children.length)) {
                eval_str += function_name + getValue(child, "number").toString();
              }
              return eval(eval_str);
            } else if (function_call_type === "IDENTIFIER") {
              let value;
              let first_value;
              switch (function_name) {
                case "print":
                  expectNChildren(function_node, 1);
                  for (let child of function_node.children.slice(1)) {
                    stdout.push(prettyPrint(getValue(child)));
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
                  let new_value = getValue(function_node.children[2]);
                  let new_type = findType(new_value);
                  vars[new_var_name] = {
                    name: new_var_name,
                    value: new_value,
                    type: new_type
                  };
                  return new_value;
                case "pow":
                  expectNChildren(function_node, 2);
                  value = getValue(function_node.children[1], "number");
                  for (let child of function_node.children.slice(2)) {
                    value = value ** getValue(child, "number");
                  }
                  return value;
                case "not":
                  expectNChildren(function_node, 2);
                  value = getValue(function_node.children[1]);
                  requireTrueOrFalse(value);
                  return !value;
                case "and":
                  expectNChildren(function_node, 2);
                  value = true;
                  for (let child of function_node.children.slice(1)) {
                    let new_value = getValue(child);
                    requireTrueOrFalse(new_value);
                    value = value && new_value;
                  }
                  return value;
                case "or":
                  expectNChildren(function_node, 2);
                  value = false;
                  for (let child of function_node.children.slice(1)) {
                    let new_value = getValue(child);
                    requireTrueOrFalse(new_value);
                    value = value || new_value;
                  }
                  return value;
                case "eq":
                  expectNChildren(function_node, 2);
                  first_value = getValue(function_node.children[1]);
                  for (let child of function_node.children.slice(2)) {
                    let new_value = getValue(child);
                    if (new_value !== first_value) {
                      return false;
                    }
                  }
                  return true;
                case "neq":
                  expectNChildren(function_node, 2);
                  first_value = getValue(function_node.children[1]);
                  for (let child of function_node.children.slice(2)) {
                    let new_value = getValue(child);
                    if (new_value !== first_value) {
                      return true;
                    }
                  }
                  return false;
                case "lte":
                case "lt":
                  expectNChildren(function_node, 3);
                  first_value = getValue(function_node.children[1], "number");
                  for (let child of function_node.children.slice(2)) {
                    let new_value = getValue(child, "number");
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
                  first_value = getValue(function_node.children[1], "number");
                  for (let child of function_node.children.slice(2)) {
                    let new_value = getValue(child, "number");
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
                  return tuple_items.map(item => getValue(item));
                case "is_tuple":
                  expectNChildren(function_node, 2);
                  for (let tuple_option of function_node.children.slice(1)) {
                    let type = findType(getValue(tuple_option));
                    if (type !== "tuple") {
                      return false;
                    }
                  }
                  return true;
                case "head":
                  expectNChildren(function_node, 2);
                  let heads = [];
                  for (let tuple_option of function_node.children.slice(1)) {
                    heads.push(getValue(tuple_option, "tuple")[0]);
                  }
                  return heads.length === 1 ? heads[0] : heads;
                case "tail":
                  expectNChildren(function_node, 2);
                  let tails = [];
                  for (let tuple_option of function_node.children.slice(1)) {
                    tails.push(getValue(tuple_option, "tuple").slice(1));
                  }
                  return tails.length === 1 ? tails[0] : tails;
                case "len":
                  expectNChildren(function_node, 2);
                  let lens = [];
                  for (let tuple_option of function_node.children.slice(1)) {
                    lens.push(getValue(tuple_option, "tuple").length);
                  }
                  return lens.length === 1 ? lens[0] : lens;
                case "cat":
                  expectNChildren(function_node, 2);
                  let base_array = getValue(function_node.children[1], "tuple").copyWithin();
                  for (let child of function_node.children.slice(2)) {
                    base_array = base_array.concat(getValue(child, "tuple").copyWithin());
                  }
                  return base_array;
                case "ret":
                  expectNChildren(function_node, 2);
                  return getValue(function_node.children[1]);
                default:
                  function_node = getValue(function_node.children[0], "function");
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
              let value = getValue(args[i]);
              new_vars[var_name.token] = {
                value,
                type: findType(value),
                name: var_name.token
              };
            });
            vars = new_vars;

            let function_exprs = function_node.children.slice(function_node.children.findIndex(child => child.type === "RPAREN")+1);

            function_exprs = function_exprs.map(function_expr => {
              return getValue(function_expr);
            });

            return function_exprs.length > 0 ? function_exprs[function_exprs.length - 1] : 0;
          case "tuple_op":
            let tuple_op_node = tree.children[1];
            let tuple_value = getValue(tuple_op_node.children[1], "tuple");
            switch (tuple_op_node.children[0].token) {
              case "head":
                return tuple_value[0];
              case "tail":
                return tuple_value.length > 1 ? tuple_value.slice(1) : tuple_value;
              case "len":
                return tuple_value.length;
            }
      }
      break;
  }
}

function prettyPrint(value) {
  let type = findType(value);

  if (type === "tuple") {
    return "(tuple " + value.map(item => prettyPrint(item)).join(' ') + ")";
  } else if (type === "function") {
    return "(function definition)";
  } else {
    return value;
  }
}

function findType(value) {
  if (Array.isArray(value)) {
    return "tuple";
  } else if (typeof (value) === "object") {
    return "function";
  } else {
    return typeof (value);
  }
}

function expectNChildren(tree, n) {
  if (tree.children.length < n) {
    throw new Error(`Expected ${JSON.stringify(tree.children)} to have at least ${n} children but has ${tree.children.length}`);
  }
}

function requireTrueOrFalse(value) {
  if (typeof (value) !== "boolean") {
    throw new Error(`Expected true or false but got '${value}' instead`);
  }

  return true;
}

module.exports = runTree;
