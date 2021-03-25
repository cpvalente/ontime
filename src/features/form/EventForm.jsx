import { Button } from '@chakra-ui/button';
import { Form, Formik } from 'formik';
import { useContext, useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import * as Yup from 'yup';
import { EventContext } from '../../app/context/eventContext';
import { EventListContext } from '../../app/context/eventListContext';
import ChakraInput from '../../common/input/ChakraInput';
import ChakraNumberInput from '../../common/input/ChakraNumberInput';
import TimeInput from '../../common/input/TimeInput';
import styles from './EventForm.module.css';
import 'react-datepicker/dist/react-datepicker-cssmodules.css';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const sampleInitialValues = {
  title: '',
  subtitle: '',
  presenter: '',
  timeStart: new Date(),
  timeEnd: new Date(),
  timerDuration: 5,
};

export default function EventForm(props) {
  const [event, setEvent] = useContext(EventContext);
  const [, setEvents] = useContext(EventListContext);
  const [initialValues, setInitialValues] = useState(null);

  useEffect(() => {
    if (props.formMode === 'edit') setInitialValues(event);
    else if (props.formMode === 'add') setInitialValues(sampleInitialValues);
    else if (props.formMode === null) setInitialValues(null);
  }, [event, props.formMode]);

  // TODO: Cleanup
  if (props.formMode === null || initialValues === null)
    return <div>Replace with nice empty illustration</div>;
  else if (props.formMode === 'edit' && event === null) {
    return <div>Replace with nice empty illustration also</div>;
  }

  const validationSchema = Yup.object({
    title: Yup.string().required('An event requires a title'),
    subtitle: Yup.string(),
    presenter: Yup.string(),
    timeStart: Yup.date(),
    timeEnd: Yup.date(),
    timerDuration: Yup.number()
      .min(1)
      .max(60)
      .required('An event requires a duration'),
  });

  const submitForm = (values) => {
    console.log('called submit');

    // prevent default stops page from refreshing, necessary?

    // update form state
    props.setFormMode(null);

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
    setEvent(null);
    setInitialValues(null);
  };

  return (
    <div>
      <Formik
        // enableReinitialize={true}
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={(values, actions) => {
          setTimeout(() => {
            submitForm(values);
          }, 100);
        }}
        // FIX: This kept being called on render
        // onReset={() => {
        //   cancelForm();
        // }}
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

            <DatePicker />
            <div className={styles.buttons}>
              <Button
                variant='outline'
                disabled={props.isSubmitting}
                // type='reset'
                onClick={() => cancelForm()}
              >
                Back
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
