import { useState } from 'react';
import Markdown from 'react-markdown';
import { Checkbox, Container } from '@chakra-ui/react';
import remarkGfm from 'remark-gfm';

interface MarkdownAreaProps {
  value: string;
  variant?: string;
  size?: string;
  submitHandler: (newValue: string) => void;
  editHandler: () => void;
}

export default function MarkdownArea(props: MarkdownAreaProps) {
  const { value, submitHandler, size, editHandler } = props;
  const [text, setText] = useState(value);
  // const styles = useStyleConfig('Textarea', { size, variant }); //TODO: this works with <Box> but can't get box to size properly around Markdown
  const markDownChecker = (line: number) => {
    const txtLines = text.split('\n');
    const activeLine = txtLines[line - 1];
    const isChecked = activeLine.indexOf('- [x] ') === 0;
    const isNotChecked = activeLine.indexOf('- [ ] ') === 0;

    if (isNotChecked) {
      txtLines[line - 1] = activeLine.replace('- [ ] ', '- [x] ');
      submitHandler(txtLines.join('\n'));
      setText(txtLines.join('\n'));
    }
    if (isChecked) {
      txtLines[line - 1] = activeLine.replace('- [x] ', '- [ ] ');
      submitHandler(txtLines.join('\n'));
      setText(txtLines.join('\n'));
    }
  };
  // __css={styles}
  return (
    <Container
      fontWeight='300'
      maxW='full'
      borderRadius='3px'
      color='#f6f6f6'
      background='#262626'
      style={{ cursor: 'text', paddingTop: '7px', paddingBottom: '7px' }}
      onClick={() => editHandler()}
    >
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          li(props) {
            // eslint-disable-next-line react/prop-types
            const { children, className, node, ...rest } = props;
            if (className === 'task-list-item') {
              // eslint-disable-next-line react/prop-types
              const position = node?.position ?? null;
              const check = [...(children as Array<{ props: { checked: boolean } }>)].shift();
              const text = [...(children as Array<string>)].pop();
              return (
                <li style={{ listStyleType: 'none' }}>
                  <Checkbox
                    variant='ontime-subtle-white'
                    size={size}
                    defaultChecked={check?.props.checked}
                    onClickCapture={(_e) => {
                      markDownChecker(position?.start.line ?? 0);
                    }}
                  >
                    {text}
                  </Checkbox>
                </li>
              );
            }
            return (
              <li
                {...rest}
                className={className}
                style={{ listStyleType: 'disc', marginLeft: '1.5em', padding: '0px' }}
              >
                {children}
              </li>
            );
          },
        }}
      >
        {`${text}\n`}
      </Markdown>
    </Container>
  );
}
