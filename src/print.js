const { findType } = require('./type');

function prettyPrint(value) {
  let type = findType(value);

  if (type === "tuple") {
    return "(tuple " + value.map(item => prettyPrint(item)).join(' ') + ")";
  } else if (type === "function") {
    return "(function definition)";
  } else if (type === "object") {
    const keys = Object.keys(value);
    return "(obj " + keys.map(key => {
      const str = prettyPrint(value[key]);
      return prettyPrint([key, str]);
    }) + ")";
  } else {
    return value;
  }
}

module.exports = prettyPrint;
