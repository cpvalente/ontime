import { useEffect, useRef } from 'react';
import { Textarea, TextareaProps } from '@chakra-ui/react';
// @ts-expect-error no types from library
import autosize from 'autosize/dist/autosize';

interface AutoTextAreaProps extends TextareaProps {
  isDark?: boolean;
}

export const AutoTextArea = (props: AutoTextAreaProps) => {
  const { isDark, ...rest } = props;
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const node = ref.current;
    autosize(ref.current);
    return () => {
      autosize.destroy(node);
    };
  }, []);

  return (
    <Textarea
      overflow='hidden'
      w='100%'
      resize='none'
      ref={ref}
      transition='height none'
      variant={isDark ? 'ontime-filled' : 'ontime-filled-on-light'}
      {...rest}
    />
  );
};
