/**
 */
export function prettierConfigurator() {
  return {
    semi: true,
    trailingComma: 'es5',
    singleQuote: true,
    bracketSpacing: true,
    printWidth: 120,
    tabWidth: 2,
    endOfLine: 'auto',
    arrowParens: 'avoid',
    parser: 'typescript',
  };
}
