export const ontimeSlider = {
  thumb: {
    background: '#f6f6f6', // $ui-white
    width: '0.25rem',
  },
  filledTrack: {
    background: '#779BE7', // $blue-400
  },
  track: {
    background: '#303030', // $gray-1050
  },
  mark: {
    color: '#b1b1b1', // $label-gray
    mt: '2',
    ml: '-2.5',
    fontSize: 'calc(1rem - 3px)',
  },
};

export const ontimeHighlightSlider = {
  ...ontimeSlider,
  filledTrack: {
    background: '#FFAB33', // $highlight-orange
  },
};
