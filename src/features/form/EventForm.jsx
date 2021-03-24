import { Button } from '@chakra-ui/button';
import { Form, Formik } from 'formik';
import { useContext, useState } from 'react';
import ReactDatePicker from 'react-datepicker';
import DatePicker from 'react-datepicker';
import * as Yup from 'yup';
import { EventListContext } from '../../app/context/eventListContext';
import ChakraInput from '../../common/input/ChakraInput';
import ChakraNumberInput from '../../common/input/ChakraNumberInput';
import TimeInput from '../../common/input/TimeInput';

import styles from './EventForm.module.css';

export default function EventForm(props) {
  const [events, setEvents] = useContext(EventListContext);
  const today = new Date();
  const initialValues = props.data ?? {
    title: '',
    subtitle: '',
    presenter: '',
    timeStart: today,
    timeEnd: today,
    timerDuration: 30,
  };

  const validationSchema = Yup.object({
    title: Yup.string().required('An event requires a title'),
    subtitle: Yup.string(),
    presenter: Yup.string(),
    timeStart: Yup.date().nullable(),
    timerDuration: Yup.number()
      .min(1)
      .max(60)
      .required('An event requires a duration'),
  });

  const submitForm = (values) => {
    // prevent default stops page from refreshing, necessary?
    console.log('form', values);

    // update form state
    props.setFormMode(null);
    props.setSelectedEvent(null);

    // are we updating or creating new?

    // add new event to data context
    if (props.formMode === 'add')
      setEvents((prevEvents) => [...prevEvents, { ...values }]);

    // edit event data from  context
    if (props.formMode === 'edit')
      setEvents((prevEvents) => [
        ...prevEvents.filter((pe) => pe.id !== values.id),
        { ...values },
      ]);
  };

  const cancelForm = () => {
    props.setFormMode(null);
    props.setSelectedEvent(null);
  };

  if (props.data === null || props.data === undefined) {
    if (props.formMode === null)
      return <div>Replace with nice empty illustration</div>;
  }

  return (
    <div>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={(values, actions) => {
          setTimeout(() => {
            submitForm(values);
          }, 100);
        }}
        onReset={(values) => cancelForm()}
      >
        {(props) => (
          <Form onSubmit={props.handleSubmit}>
            <ChakraInput
              name='title'
              label='Event Title'
              placeholder='eg. Is the Internet a fad?'
            />
            <ChakraInput
              name='subtitle'
              label='Event Subtitle'
              placeholder='eg. After tea thoughts'
            />
            <ChakraInput
              name='presenter'
              label='Presenter Name'
              placeholder='eg. Duran Duran'
            />
            {/* <TimeInput name='timeStart' label='Scheduled Start' /> */}
            <ChakraNumberInput
              name='timerDuration'
              label='Timer Duration (minutes)'
              allowMouseWheel
              min={1}
              max={60}
              maxW={24}
            />

            <div className={styles.buttons}>
              <Button
                variant='outline'
                disabled={props.isSubmitting}
                type='reset'
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
          </Form>
        )}
      </Formik>
    </div>
  );
}
