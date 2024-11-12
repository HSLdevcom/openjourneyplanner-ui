module.exports = {
  parser: '@babel/eslint-parser',
  extends: [
    'plugin:compat/recommended',
    'plugin:jsx-a11y/recommended',
    'airbnb',
    'plugin:prettier/recommended',
  ],
  rules: {
    curly: ['error', 'all'],
    'lines-between-class-members': 'warn',
    'no-else-return': 'warn',
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    'no-console': 'error',
    'no-restricted-exports': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/no-named-default': 'off',
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    // react
    'react/button-has-type': 'warn',
    'react/destructuring-assignment': 'off',
    'react/jsx-filename-extension': ['error', { extensions: ['.js'] }],
    'react/jsx-fragments': 'off',
    'react/jsx-key': 'error',
    'react/jsx-props-no-spreading': 'off',
    'react/forbid-prop-types': ['warn', { forbid: ['any', 'array', 'object'] }],
    'react/require-default-props': 'warn',
    'react/sort-comp': 'off',
    'react/state-in-constructor': 'off',
    'react/static-property-placement': 'off',
    'react/function-component-definition': 'off',

    // jsx-a11y
    'jsx-a11y/anchor-is-valid': [
      'error',
      {
        components: ['Link'],
        specialLink: ['to'],
        aspects: ['noHref', 'invalidHref', 'preferButton'],
      },
    ],
    'jsx-a11y/label-has-associated-control': 'off', // this has a bug with FormattedMessage
    'jsx-a11y/label-has-for': 'off', // deprecated in 6.1.0, does not support select tags
    'jsx-a11y/control-has-associated-label': 'off', // this has a bug with FormattedMessage

    // compat
    'compat/compat': 'warn',

    // prettier
    'prettier/prettier': [
      'error',
      {
        arrowParens: 'avoid',
        endOfLine: 'auto',
        singleQuote: true,
        trailingComma: 'all',
      },
    ],
  },
  env: {
    browser: true,
  },
  plugins: ['react', 'compat', 'prettier', 'jsx-a11y'],
  settings: {
    polyfills: ['fetch', 'promises'],
  },
  overrides: [
    {
      files: ['*.js'],
      processor: '@graphql-eslint/graphql',
    },
    {
      files: ['*.graphql'],
      extends: [
        'plugin:@graphql-eslint/operations-recommended',
        'plugin:@graphql-eslint/relay',
      ],
      // Available rules can be found at https://the-guild.dev/graphql/eslint/rules/naming-convention
      rules: {
        '@graphql-eslint/no-deprecated': 'warn',
        // Recommended naming conventions have some clashes with relay conventions
        '@graphql-eslint/naming-convention': [
          'error',
          {
            VariableDefinition: 'camelCase',
          },
        ],
        // Relay directives caused errors and ignoring them didn't work for some reason
        '@graphql-eslint/known-directives': 'off',

        // These require parserOptions.operations to be defined
        // but haven't been able to figure out if it is possible
        // to define them with relay
        '@graphql-eslint/known-fragment-names': 'off',
        '@graphql-eslint/no-one-place-fragments': 'off',
        '@graphql-eslint/no-undefined-variables': 'off',
        '@graphql-eslint/no-unused-fragments': 'off',
        '@graphql-eslint/no-unused-variables': 'off',
        '@graphql-eslint/require-id-when-available': 'off',
        '@graphql-eslint/require-import-fragment': 'off',
        '@graphql-eslint/selection-set-depth': 'off',
        '@graphql-eslint/unique-fragment-name': 'off',
        '@graphql-eslint/unique-operation-name': 'off',
      },
      parserOptions: {
        schema: './build/schema.graphql',
      },
    },
  ],
};
