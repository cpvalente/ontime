/**
 * returns a new version of the pased function that is throttled
 * @param {Function} func - function to throttle
 * @param {number} wait - wait time in ms
 * @returns {Function}
 * adapted from https://underscorejs.org/docs/modules/throttle.html
 */
export function throttle(func, wait) {
  var timeout, context, args, result;
  var previous = 0;

  function later() {
    previous = Date.now();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout) context = args = null;
  }

  function throttled() {
    var _now = Date.now();
    if (!previous) previous = _now;
    var remaining = wait - (_now - previous);
    context = this;
    args = arguments;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = _now;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    } else if (!timeout) {
      timeout = setTimeout(later, remaining);
    }
    return result;
  }

  return throttled;
}
