/**
 * @description Extracts the accessor field of visible objects in an array
 * @param {array} data
 * @return {string[]}
 */
export const extractVisible = (data) => {
  const propertyArray = [];
  for (const d of data) {
    if (d.visible) {
      propertyArray.push(d.accessor);
    }
  }
  return propertyArray;
};

/**
 * @description Filters data fields by a given list of accessors
 * @param {array} data
 * @param {string[]} accessorsToShow
 * @return {object[]}
 */
export const filterObjects = (data, accessorsToShow) => {
  const filteredData = [];
  for (const d of data) {
    let o = { id: d.id };
    for (const a of accessorsToShow) {
      o[a] = d[a];
    }
    filteredData.push(o);
  }
  return filteredData;
};