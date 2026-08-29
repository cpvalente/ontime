/**
 * Images in the cuesheet live inside a virtualised table:
 * rows are unmounted when they leave the viewport and mounted again when they come back.
 * A re-mounted image has no dimensions until it is available,
 * which makes the row change height and the table shift under the user.
 *
 * We remember the aspect ratio of the images we have already seen
 * so that we can reserve the space they will take.
 * This only holds two numbers per image: we leave the image data itself to the browser cache,
 * which knows better than us when memory should be released.
 */

/** how many aspect ratios we remember, this is only a few bytes per entry */
const maxSize = 500;

const aspectRatios = new Map<string, number>();

/**
 * @returns the aspect ratio of a previously loaded image, if we have seen it before
 */
export function getRememberedAspectRatio(src: string | null | undefined): number | null {
  if (!src) {
    return null;
  }
  return aspectRatios.get(src) ?? null;
}

/**
 * Records the aspect ratio of a loaded image
 */
export function rememberAspectRatio(src: string | null | undefined, image: HTMLImageElement) {
  if (!src || image.naturalHeight === 0) {
    return;
  }

  // the map iteration order is our LRU queue, re-adding the entry marks it as recently used
  aspectRatios.delete(src);
  aspectRatios.set(src, image.naturalWidth / image.naturalHeight);

  while (aspectRatios.size > maxSize) {
    const oldest = aspectRatios.keys().next();
    if (oldest.done) {
      return;
    }
    aspectRatios.delete(oldest.value);
  }
}
