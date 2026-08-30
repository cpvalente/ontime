/**
 * Images in the cuesheet live inside a virtualised table:
 * rows are unmounted when they leave the viewport and mounted again when they come back.
 * A re-mounted image has no dimensions until it is available,
 * which makes the row change height and the table shift under the user.
 *
 * We remember the size of the images we have already seen
 * so that we can reserve the space they will take.
 * This only holds two numbers per image: we leave the image data itself to the browser cache,
 * which knows better than us when memory should be released.
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

/** how many sizes we remember, this is only a few bytes per entry */
const maxSize = 500;

const dimensions = new Map<string, ImageDimensions>();

/**
 * @returns the size of a previously loaded image, if we have seen it before
 */
export function getRememberedDimensions(src: string): ImageDimensions | null {
  return dimensions.get(src) ?? null;
}

/**
 * Records the size of a loaded image
 */
export function rememberDimensions(src: string, image: HTMLImageElement) {
  if (image.naturalHeight === 0) {
    return;
  }

  // the map iteration order is our LRU queue, re-adding the entry marks it as recently used
  dimensions.delete(src);
  dimensions.set(src, { width: image.naturalWidth, height: image.naturalHeight });

  while (dimensions.size > maxSize) {
    const oldest = dimensions.keys().next();
    if (oldest.done) {
      return;
    }
    dimensions.delete(oldest.value);
  }
}
