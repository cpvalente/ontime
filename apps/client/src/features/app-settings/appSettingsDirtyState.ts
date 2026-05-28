let _isDirty = false;

export const markDirty = () => {
  _isDirty = true;
};

export const markClean = () => {
  _isDirty = false;
};

export const getIsDirty = () => _isDirty;
