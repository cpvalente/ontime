import { type RefObject, useEffect } from 'react';
import { Textarea, TextareaProps } from '@chakra-ui/react';
// @ts-expect-error no types from library
import autosize from 'autosize/dist/autosize';

export const AutoTextArea = (props: TextareaProps & { inputRef: RefObject<unknown> }) => {
  const { value, inputRef } = props;

  useEffect(() => {
    const node = inputRef.current;
    autosize(inputRef.current);
    return () => {
      autosize.destroy(node);
    };
  }, [value]);

  return (
    <Textarea
      overflow='hidden'
      w='100%'
      resize='none'
      ref={inputRef}
      transition='height none'
      variant='ontime-transparent'
      {...props}
    />
  );
};
