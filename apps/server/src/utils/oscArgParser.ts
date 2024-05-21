import { ArgumentType } from 'node-osc';
import { splitWhitespace } from 'ontime-utils';

export function stringToOSCArgs(argsString: string | undefined): ArgumentType[] {
  if (typeof argsString === 'undefined') {
    return new Array<ArgumentType>();
  }
  const matches = splitWhitespace(argsString);

  const parsedArguments = matches.map((argString: string) => {
    const maybeNumber = Number(argString);
    if (!Number.isNaN(maybeNumber)) {
      //NOTE: number like: 1 2.0 33333
      //TODO: we cant foce a float with our current osc lib
      return maybeNumber;
    }

    if (argString.startsWith('"') && argString.endsWith('"')) {
      // NOTE: "quoted string" or "1234"
      return argString.substring(1, argString.length - 1);
    }

    return argString;
  });

  return parsedArguments;
}
