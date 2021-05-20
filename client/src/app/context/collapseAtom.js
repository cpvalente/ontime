const { atom } = require('jotai');

const PATH = 'option-collapse';
const initialValue = {};

// collapse options object, initialised from local storage
// REFRACT: When do we read from local storage?
//          on every render?

export const collapseAtom = atom(
  (get) => {
    const storedOptions = localStorage.getItem(PATH);
    if (storedOptions == null) return initialValue;

    return JSON.parse(storedOptions);
  },
  (get, set, newValues) => {
    set(collapseAtom, newValues);
    localStorage.setItem(PATH, JSON.stringify(newValues));
  }
);

// get a single option, if it exists
export const SelectCollapse = (id) => {
  return atom((get) => get(collapseAtom)[id]);
};

// change a single item in object
export const HandleCollapse = atom(null, (get, set, payload) => {
  const updatedVal = {
    ...get(collapseAtom),
    ...payload,
  };
  set(collapseAtom, updatedVal);
  localStorage.setItem(PATH, JSON.stringify(updatedVal));
});

// change collapsed in several items
export const BatchOperation = atom(null, (get, set, payload) => {
  let prevOptions = get(collapseAtom);

  let newOptions = {};

  for (const item of payload.items) {
    newOptions[item.id] = payload.isCollapsed;
  }

  if (payload.clear) {
    // clear object
    prevOptions = {};
    // clear localstorage
    localStorage.removeItem(PATH);
  }

  const options = { ...prevOptions, ...newOptions };

  set(collapseAtom, options);

  localStorage.setItem(PATH, JSON.stringify(options));
});

// change collapsed in all items
export const setAll = async (items, isCollapsed) => {
  // clear storage
  localStorage.removeItem(PATH);

  // call batch
  BatchOperation({ items: items, isCollapsed: isCollapsed });
};
