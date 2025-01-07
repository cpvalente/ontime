import { forwardRef, RefObject, useEffect } from 'react';
import { Textarea, TextareaProps } from '@chakra-ui/react';
// @ts-expect-error no types from library
import autosize from 'autosize/dist/autosize';

export const AutoTextArea = forwardRef<HTMLTextAreaElement, TextareaProps>(function AutoTextArea(props, ref) {
  const { value } = props;

  useEffect(() => {
    const node = ref as RefObject<HTMLTextAreaElement>;
    autosize(node.current);
    return () => {
      autosize.destroy(node.current);
    };
  }, [ref, value]);

  return (
    <Textarea
      ref={ref}
      overflow='hidden'
      w='100%'
      resize='none'
      transition='height none'
      variant='ontime-transparent'
      {...props}
    />
  );
});
