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
    case "number":
      return js_value;
    case "object":
      return js_value;
    default:
      throw new Error(`Cannot coerce JavaScript type ${js_type} back`);
  }
}

function coerceValue(value) {
  let type = findType(value);

  switch (type) {
    case "tuple":
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
