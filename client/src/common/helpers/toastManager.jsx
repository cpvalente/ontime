import { createStandaloneToast } from '@chakra-ui/react';

const toast = createStandaloneToast();
// const customToast = createStandaloneToast({ theme: yourCustomTheme })

// error toast
export const showErrorToast = (title, description) => {
  toast({
    title: title,
    description: description,
    position: 'top-left',
    variant: 'subtle',
    status: 'error',
    isClosable: true,
  });
};

// warning toast
export const showWarningToast = (title, description) => {
  toast({
    title: title,
    description: description,
    position: 'top-left',
    variant: 'subtle',
    status: 'warning',
    isClosable: true,
  });
};
