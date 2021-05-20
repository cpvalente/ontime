const { atom } = require('jotai');

const PATH = 'option-gen';
const initialValue = {
  cursor: 'locked',
};

export const settingsAtom = atom(
  (get) => {
    const storedOptions = localStorage.getItem(PATH);
    if (storedOptions == null) return initialValue;

    return JSON.parse(storedOptions);
  },
  (get, set, newValues) => {
    set(settingsAtom, newValues);
    localStorage.setItem(PATH, JSON.stringify(newValues));
  }
);

// get a single option, if it exists
export const SelectSetting = (setting) => {
  return atom((get) => get(settingsAtom)[setting]);
};

// change a single item in object
export const HandleOptions = atom(null, (get, set, payload) => {
  const updatedVal = {
    ...get(settingsAtom),
    ...payload,
  };
  set(settingsAtom, updatedVal);
  localStorage.setItem(PATH, JSON.stringify(updatedVal));
});
