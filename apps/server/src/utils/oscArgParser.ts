import { Argument } from 'node-osc';
import { splitWhitespace } from 'ontime-utils';

export function stringToOSCArgs(argsString: string | undefined): Argument[] {
  if (typeof argsString === 'undefined') {
    return new Array<Argument>();
  }
  const matches = splitWhitespace(argsString);

  const parsedArguments: Argument[] = matches.map((argString: string) => {
    const argAsNum = Number(argString);
    // NOTE: number like: 1 2.0 33333
    if (!Number.isNaN(argAsNum)) {
      return { type: argString.includes('.') ? 'f' : 'i', value: argAsNum };
    }

    if (argString.startsWith('"') && argString.endsWith('"')) {
      // NOTE: "quoted string"
      return { type: 's', value: argString.substring(1, argString.length - 1) };
    }

    if (argString === 'TRUE') {
      // NOTE: Boolean true
      return { type: 'T', value: true };
    }

    if (argString === 'FALSE') {
      // NOTE: Boolean false
      return { type: 'F', value: false };
    }

    // NOTE: string
    return { type: 's', value: argString };
  });

  return parsedArguments;
}
