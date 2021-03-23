import { FormErrorMessage } from '@chakra-ui/form-control';
import { FormLabel } from '@chakra-ui/form-control';
import { FormControl } from '@chakra-ui/form-control';
import { Input } from '@chakra-ui/input';
import { Field } from 'formik';

export default function ChakraInput(props) {
  const { label, name, ...rest } = props;
  return (
    <Field name={name}>
      {({ field, form }) => {
        return (
          <FormControl>
            <FormLabel
              htmlFor={name}
              isInvalid={form.errors[name] && form.touched[name]}
            >
              {label}
            </FormLabel>
            <Input id={name} {...rest} {...field} />
            <FormErrorMessage>{form.errors[name]}</FormErrorMessage>
          </FormControl>
        );
      }}
    </Field>
  );
}
