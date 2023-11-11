export const ontimeModal = {
  header: {
    fontWeight: 400,
    letterSpacing: '0.3px',
    padding: '1rem 1.5rem',
    fontSize: '1.25rem',
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
    padding: '0.5rem',
  },
};

export const ontimeSmallModal = {
  ...ontimeModal,
  body: {
    padding: '1rem',
    fontSize: 'calc(1rem - 2px)',
  },
  dialog: {
    minHeight: 'min(200px, 10vh)',
  },
};

export const ontimeUploadModal = {
  ...ontimeSmallModal,
  body: {
    padding: '1rem',
    fontSize: 'calc(1rem - 2px)',
  },
  dialog: {
    minHeight: 'min(200px, 10vh)',
    maxWidth: 'min(800px, 80vh)',
  },
};
