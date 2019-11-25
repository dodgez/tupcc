const { findType } = require('./type');

function prettyPrint(value) {
  let type = findType(value);

  if (type === "tuple") {
    return "(tuple " + value.map(item => prettyPrint(item)).join(' ') + ")";
  } else if (type === "function") {
    return "(function definition)";
  } else if (type === "string") {
    return `"${value}"`;
  } else {
    return value;
  }
}

module.exports = prettyPrint;
