import { FormErrorMessage } from '@chakra-ui/form-control';
import { FormLabel } from '@chakra-ui/form-control';
import { FormControl } from '@chakra-ui/form-control';
import { NumberInputStepper } from '@chakra-ui/number-input';
import { NumberInputField } from '@chakra-ui/number-input';
import { NumberDecrementStepper } from '@chakra-ui/number-input';
import { NumberIncrementStepper } from '@chakra-ui/number-input';
import { NumberInput } from '@chakra-ui/number-input';
import { Field } from 'formik';

export default function ChakraNumberInput(props) {
  const { label, name, ...rest } = props;

  return (
    <Field name={name}>
      {({ field, form }) => {
        return (
          <FormControl isInvalid={form.errors[name] && form.touched[name]}>
            <FormLabel htmlFor={name}>{label}</FormLabel>
            <NumberInput
              defaultValue={field.value}
              {...rest}
              onChange={(val) => form.setFieldValue(field.name, val)}
            >
              <NumberInputField id={name} {...field} />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>

            <FormErrorMessage>{form.errors[name]}</FormErrorMessage>
          </FormControl>
        );
      }}
    </Field>
  );
}
