module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
  ],
  plugins: [
    // Transform import.meta.env.X → process.env.X (Vite → Node compat)
    function importMetaEnvPlugin({ types: t }) {
      return {
        visitor: {
          MetaProperty(path) {
            path.replaceWith(
              t.objectExpression([
                t.objectProperty(
                  t.identifier('env'),
                  t.memberExpression(
                    t.identifier('process'),
                    t.identifier('env'),
                  ),
                ),
              ]),
            )
          },
        },
      }
    },
  ],
}
