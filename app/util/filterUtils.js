/**
 * Filters object that contains objects so that only objects that have
 * a certain key with the correct value defined are returned.
 *
 * @param {*} obj object to filter
 * @param {String} filter key on object's child objects
 * @param {*} filterValue the key's intended value
 * @returns filtered object
 */
export const filterObject = (obj, filter, filterValue) =>
  Object.keys(obj).reduce(
    (acc, val) =>
      obj[val][filter] === filterValue
        ? {
            ...acc,
            [val]: obj[val],
          }
        : acc,
    {},
  );
