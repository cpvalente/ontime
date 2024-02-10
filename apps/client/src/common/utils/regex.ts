/**
 * Simple regex patterns for common use cases
 * mostly used in form validation
 */

export const isOnlyNumbers = /^\d+$/;
export const isIPAddress = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
export const startsWithHttp = /^http:\/\//;
export const startsWithSlash = /^\//;
