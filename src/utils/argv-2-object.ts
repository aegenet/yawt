const RE_ARGV = /^--([\w\-_]+)(=)?(.*)$/;
const RE_ARGV_VALUE = /^([^"']*)$|^'([^']*)'$|^"([^"]*)"$/;
const RE_IS_NUMBER = /^\d+$/;

/**
 * Convert an array of command line arguments to an object.
 *
 * @param argv - An array of command line arguments.
 * @returns An object with the command line arguments.
 * @example
 * ```ts
 * const argv = ['--name', 'John', '--age', '25'];
 * const result = argv2Object(argv);
 * //=> { name: 'John', age: 25 }
 * ```
 */
export function argv2Object<O extends object = Record<string, string | boolean | number>>(argv: string[]): O {
  const params: O = {} as O;
  let keyVal: RegExpMatchArray | null;
  let key: string;
  let value: string | boolean | number;
  for (let i = 0; i < argv.length; i++) {
    keyVal = argv[i].match(RE_ARGV);
    if (keyVal?.length) {
      key = keyVal[1];
      if (keyVal[2]) {
        value = keyVal[3];
      } else {
        if (argv.length <= i + 1 || argv[i + 1]?.startsWith('--')) {
          value = true;
        } else {
          value = argv[++i];
        }
      }

      if (value !== true) {
        const valueMatch = value.match(RE_ARGV_VALUE);
        if (valueMatch?.length) {
          if (valueMatch[1]) {
            if (valueMatch[1].match(RE_IS_NUMBER)) {
              value = parseInt(valueMatch[1], 10);
            } else if (valueMatch[1] === 'true' || valueMatch[1] === 'false') {
              value = valueMatch[1] === 'true';
            } else {
              value = valueMatch[1];
            }
          } else if (value) {
            value = valueMatch[2] || valueMatch[3];
          }
        }
      }
      (params as Record<string, unknown>)[key] = value;
    }
  }
  return params;
}
