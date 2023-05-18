export const inputProps = {
  size: 'sm',
  autoComplete: 'off',
};

export const portInputProps = {
  ...inputProps,
  type: 'number',
  min: '1024',
  max: '65535',
};
