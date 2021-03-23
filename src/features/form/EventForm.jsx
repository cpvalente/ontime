import { Button } from '@chakra-ui/button';
import { Formik } from 'formik';
import * as Yup from 'yup';
import ChakraInput from '../../common/input/ChakraInput';
import ChakraNumberInput from '../../common/input/ChakraNumberInput';

import styles from './EventForm.module.css';

export default function EventForm(props) {
  const initialValues = props.data ?? {
    id: '1',
    title: 'Is the internet a fad?',
    subtitle: 'It is',
    presenter: 'Carlos Valente',
    timeStart: '10:00',
    timeEnd: '11:30',
    timerDuration: 10,
    message: {
      text: 'Hurry Up!',
      color: '#F00',
      active: false,
    },
  };

  const validationSchema = Yup.object({
    title: Yup.string().required(),
    subtitle: Yup.string(),
    presenter: Yup.string(),
    timerDuration: Yup.number().required().min(1).max(60),
  });

  const submitForm = (values) => {
    console.log('form', values);
  };

  if (props.data === null || props.data === undefined) {
    return <div>nothing selected</div>;
  }

  return (
    <div>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={(values, actions) => {
          setTimeout(() => {
            console.log(values);
            actions.setSubmitting(false);
          }, 100);
        }}
      >
        {(props) => (
          <form onSubmit={props.handleSubmit}>
            <ChakraInput name='title' label='Event Title' />
            <ChakraInput name='subtitle' label='Event Subtitle' />
            <ChakraInput name='presenter' label='Presenter Name' />
            <ChakraNumberInput
              name='timerDuration'
              label='Timer Duration'
              allowMouseWheel
              min={1}
              max={60}
              maxW={24}
            />

            <div className={styles.buttons}>
              <Button
                variant='outline'
                disabled={props.isSubmitting}
                onClick={() => console.log('ccancel form?')}
              >
                Cancel
              </Button>
              <Button
                colorScheme='teal'
                isLoading={props.isSubmitting}
                disabled={!props.isValid || !props.dirty || props.isSubmitting}
                type='submit'
              >
                Save
              </Button>
            </div>
          </form>
        )}
      </Formik>
    </div>
  );
}
