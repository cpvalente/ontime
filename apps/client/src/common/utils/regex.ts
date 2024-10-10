/**
 * Simple regex patterns for common use cases
 * mostly used in form validation
 */

export const isOnlyNumbers = /^\d+$/;
export const isIPAddress = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
export const startsWithSlash = /^\//;
export const isAlphanumeric = /^[a-z0-9]+$/i;
export const isASCII = /^[ -~]+$/; //https://catonmat.net/my-favorite-regex
export const isASCIIorEmpty = /^$|^[ -~]+$/; //https://catonmat.net/my-favorite-regex
export const isNotEmpty = /\S/;
