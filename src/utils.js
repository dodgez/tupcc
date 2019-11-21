function expectNChildren(tree, n) {
  if (tree.children.length < n) {
    throw new Error(`Expected ${JSON.stringify(tree.children)} to have at least ${n} children but has ${tree.children.length}`);
  }
}

module.exports = { expectNChildren };
