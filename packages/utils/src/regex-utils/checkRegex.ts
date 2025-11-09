export const regex = {
  isOnlyNumbers: /^\d+$/,
  isIPAddress: /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/,
  startsWithHttp: /^https?:\/\//,
  startsWithSlash: /^\//,
  isAlphanumeric: /^[a-z0-9]+$/i,
  isAlphanumericWithSpace: /^[a-z0-9_ ]+$/i,
  isASCII: /^[ -~]+$/, // https://catonmat.net/my-favorite-regex
  isASCIIorEmpty: /^$|^[ -~]+$/, // https://catonmat.net/my-favorite-regex
  isNotEmpty: /\S/,
  isUrlSafe: /^[a-zA-Z0-9_-]*$/, // https://stackoverflow.com/questions/24419067/validate-a-string-to-be-url-safe-using-regex
};

export const checkRegex = {
  isOnlyNumbers: (text: string): boolean => regex.isOnlyNumbers.test(text),
  isIPAddress: (text: string): boolean => regex.isIPAddress.test(text),
  startsWithHttp: (text: string): boolean => regex.startsWithHttp.test(text),
  startsWithSlash: (text: string): boolean => regex.startsWithSlash.test(text),
  isAlphanumeric: (text: string): boolean => regex.isAlphanumeric.test(text),
  isAlphanumericWithSpace: (text: string): boolean => regex.isAlphanumericWithSpace.test(text),
  isASCII: (text: string): boolean => regex.isASCII.test(text),
  isASCIIorEmpty: (text: string): boolean => regex.isASCIIorEmpty.test(text),
  isUrlSafe: (text: string): boolean => regex.isUrlSafe.test(text),
  isNotEmpty: (text: string): boolean => regex.isNotEmpty.test(text),
};
