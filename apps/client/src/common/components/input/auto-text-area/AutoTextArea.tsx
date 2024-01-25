import { useEffect, useRef } from 'react';
import { Textarea, TextareaProps } from '@chakra-ui/react';
// @ts-expect-error no types from library
import autosize from 'autosize/dist/autosize';

export const AutoTextArea = (props: TextareaProps) => {
  const { value } = props;

  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const node = ref.current;
    autosize(ref.current);
    return () => {
      autosize.destroy(node);
    };
  }, [value]);

  return (
    <Textarea
      overflow='hidden'
      w='100%'
      resize='none'
      ref={ref}
      transition='height none'
      variant='ontime-transparent'
      {...props}
    />
  );
};
