/**
 * Validates an alias against defined parameters
 * @param {string} alias
 * @returns {{message: string, status: boolean}}
 */
export const validateAlias = (alias) => {

  const valid = { status: true, message: 'ok' };

  if (alias === '' || alias == null) {
    // cannot be empty
    valid.status = false;
    valid.message = 'Alias not defined';
  } else if (alias.includes('http') || alias.includes('https') || alias.includes('www')) {
    // cannot contain http, https or www
    valid.status = false;
    valid.message = 'Alias is not an url and cannot include http, https, www';
  } else if (alias.includes('127.0.0.1') || alias.includes('localhost') || alias.includes('0.0.0.0')) {
    // aliases cannot contain hostname
    valid.status = false;
    valid.message = 'Alias should not include hostname';
  } else if (alias.startsWith('editor')) {
    // no editor
    valid.status = false;
    valid.message = 'No aliases to editor page allowed';
  }

  return valid;
};