const lngr = require("lngr");

function findType(value) {
  if (Array.isArray(value)) {
    return "tuple";
  } else if (typeof(value) === "object" && value instanceof lngr.utils.ASTNode) {
    return "function";
  } else {
    return typeof (value);
  }
}

function coerceBack(js_value) {
  let js_type = typeof(js_value);

  switch (js_type) {
    case "string":
      return js_value.split('');
    case "number":
      return js_value;
    case "object":
      if (Array.isArray(js_value)) {
        return js_value;
      }
    default:
      throw new Error(`Cannot coerce JavaScript type ${js_type} back`);
  }
}

function coerceValue(value) {
  let type = findType(value);

  switch (type) {
    case "tuple":
      let is_string = true;
      for (let item of value) {
        if (typeof(item) !== "string") {
          is_string = false;
        }
      }

      return is_string ? value.join("") : value;
    case "number":
      return value;
    default:
      throw new Error(`Cannot coerce type ${type} for use in JavaScript`);
  }
}

function requireTrueOrFalse(value) {
  if (typeof (value) !== "boolean") {
    throw new Error(`Expected true or false but got '${value}' instead`);
  }

  return true;
}

module.exports = { findType, coerceBack, coerceValue, requireTrueOrFalse };
