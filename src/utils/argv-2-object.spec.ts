import { argv2Object } from './argv-2-object';
import { describe, it, expect } from 'vitest';

describe('argv2Object', () => {
  it('should convert command line arguments to an object', () => {
    const argv = ['--name', 'John', '--age', '25'];
    const result = argv2Object(argv);
    const expected = { name: 'John', age: 25 };
    expect(result).toEqual(expected);
  });

  it('equals syntax', () => {
    const argv = ['--name=John', '--age=25'];
    const result = argv2Object(argv);
    const expected = { name: 'John', age: 25 };
    expect(result).toEqual(expected);
  });

  it('equals syntax with quotes', () => {
    const argv = ["--name='John'", "--age='25'"];
    const result = argv2Object(argv);
    const expected = { name: 'John', age: '25' };
    expect(result).toEqual(expected);
  });

  it('equals syntax with double quotes', () => {
    const argv = ['--name="John"', '--age="25"'];
    const result = argv2Object(argv);
    const expected = { name: 'John', age: '25' };
    expect(result).toEqual(expected);
  });

  it('should handle empty arguments', () => {
    const argv: string[] = [];
    const result = argv2Object(argv);
    const expected = {};
    expect(result).toEqual(expected);
  });

  it('should handle arguments with no values', () => {
    const argv = ['--verbose', '--debug'];
    const result = argv2Object(argv);
    const expected = { verbose: true, debug: true };
    expect(result).toEqual(expected);
  });

  // Add more test cases as needed
});
