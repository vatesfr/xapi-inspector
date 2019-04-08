const pkg = require("./package.json");

module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        debug: true,
        loose: true,
        targets: (() => {
          let node = (pkg.engines || {}).node;
          if (node !== undefined) {
            const trimChars = "^=>~";
            while (trimChars.includes(node[0])) {
              node = node.slice(1);
            }
          }
          return { browsers: pkg.browserslist, node };
        })(),
        useBuiltIns: "@babel/polyfill" in (pkg.dependencies || {}) && "usage",
      },
    ],
  ],
};
