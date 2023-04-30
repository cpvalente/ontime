export const ontimeModal = {
  header: {
    fontWeight: 400,
    letterSpacing: '0.3px',
    padding: '16px 24px',
    fontSize: '20px',
    color: '#202020', // $gray-50
  },
  dialog: {
    borderRadius: '3px',
    padding: 0,
    minHeight: 'min(500px, 75vh)',
  },
  body: {
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  closeButton: {
    color: '#202020', // $gray-50
  },
  footer: {
    padding: '8px',
  },
};

export const ontimeSmallModal = {
  ...ontimeModal,
  body: {
    padding: '16px',
    fontSize: '14px',
  },
  dialog: {
    minHeight: 'min(200px, 10vh)',
  },
};
