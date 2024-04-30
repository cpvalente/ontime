import { useMemo } from 'react';
import { useToast } from '@chakra-ui/react';

import { setClientIdentify } from '../../api/clientRemote';
import { useClientStore } from '../../stores/clientStore';

export default function IdentToast() {
  const toast = useToast();
  const { self, identify } = useClientStore();
  const id = 'identToast';

  useMemo(() => {
    if (self && self in identify) {
      // you are asked to identify
      if (identify[self] && !toast.isActive(id)) {
        toast({
          id,
          title: 'Identryfy Me',
          description: `This client is named "${self}"`,
          status: 'info',
          isClosable: true,
          position: 'top',
          onCloseComplete: () => setClientIdentify(self, false),
        });
      }
      // you are asked to stop identifying
      if (!identify[self] && toast.isActive(id)) {
        toast.closeAll();
      }
    }
  }, [identify, self, toast]);

  return null;
}
