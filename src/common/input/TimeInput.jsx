import { FormErrorMessage } from '@chakra-ui/form-control';
import { FormLabel } from '@chakra-ui/form-control';
import { FormControl } from '@chakra-ui/form-control';
import DatePicker from 'react-datepicker';
import { Field } from 'formik';
import 'react-datepicker/dist/react-datepicker.css';
import './timeInput.css';

export default function TimeInput(props) {
  const { label, name, ...rest } = props;
  return (
    <Field name={name}>
      {({ field, form }) => {
        const { setFieldValue } = form;
        const { value } = field;
        return (
          <FormControl isInvalid={form.errors[name] && form.touched[name]}>
            <FormLabel htmlFor={name}>{label}</FormLabel>
            <DatePicker
              id={name}
              {...field}
              {...rest}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              dateFormat='hh:mm'
              selected={value}
              onChange={(val) => setFieldValue(name, val)}
            />
            <FormErrorMessage>{form.errors[name]}</FormErrorMessage>
          </FormControl>
        );
      }}
    </Field>
  );
}
