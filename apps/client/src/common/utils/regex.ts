/**
 * Simple regex patterns for common use cases
 * mostly used in form validation
 */

export const isOnlyNumbers = /^\d+$/;
export const isIPAddress = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
export const startsWithHttp = /^https?:\/\//;
export const startsWithSlash = /^\//;
export const isAlphanumeric = /^[a-z0-9]+$/i;
export const isASCII = /^[ -~]+$/; //https://catonmat.net/my-favorite-regex
export const isASCIIorEmpty = /^$|^[ -~]+$/; //https://catonmat.net/my-favorite-regex
export const isNotEmpty = /\S/;
export const isUrlSafe = /^[a-zA-Z0-9_-]*$/; // https://stackoverflow.com/questions/24419067/validate-a-string-to-be-url-safe-using-regex
