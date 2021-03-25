export const sortByDate = (arr) => {
  const sorter = (a, b) => {
    return new Date(a.timeStart).getTime() - new Date(b.timeStart).getTime();
  };
  return arr.sort(sorter);
};

export const sortByNumber = (arr) => {
  const sorter = (a, b) => {
    return a.order - b.order;
  };
  return arr.sort(sorter);
};
