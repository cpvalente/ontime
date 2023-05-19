import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { OscSubscription } from 'ontime-types';
import { TimerLifeCycle } from 'ontime-types';

import useOscSettings, { usePostOscSubscriptions } from '../../../common/hooks-query/useOscSettings';
import { useEmitLog } from '../../../common/stores/logger';
import OntimeModalFooter from '../OntimeModalFooter';

import OscSubscriptionRow from './OscSubscriptionRow';

import styles from '../Modal.module.scss';

type OntimeCycle = keyof typeof TimerLifeCycle;

const sectionText: { [key in TimerLifeCycle]: { title: string; subtitle: string } } = {
  onLoad: {
    title: 'On Load',
    subtitle: 'Triggers when a timer is loaded',
  },
  onStart: {
    title: 'On Start',
    subtitle: 'Triggers when a timer starts',
  },
  onPause: {
    title: 'On Pause',
    subtitle: 'Triggers when a running timer is paused',
  },
  onStop: {
    title: 'On Stop',
    subtitle: 'Triggers when a running timer is stopped',
  },
  onUpdate: {
    title: 'On Every Second',
    subtitle: 'Triggers when timers are updated (at least once a second, can be more)',
  },
  onFinish: {
    title: 'On Finish',
    subtitle: 'Triggers when a running reaches 0',
  },
};

export default function OscIntegration() {
  const { data } = useOscSettings();
  const { mutateAsync } = usePostOscSubscriptions();
  const { emitError } = useEmitLog();
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { isSubmitting, isDirty, isValid },
  } = useForm<OscSubscription>({
    defaultValues: data.subscriptions,
    values: data.subscriptions,
  });

  const [showSection, setShowSection] = useState<OntimeCycle>(TimerLifeCycle.onLoad);

  const resetForm = () => {
    reset(data.subscriptions);
  };

  const onSubmit = async (values: OscSubscription) => {
    try {
      const subscriptions = {
        onLoad: values.onLoad ?? [],
        onStart: values.onStart ?? [],
        onPause: values.onPause ?? [],
        onStop: values.onStop ?? [],
        onUpdate: values.onUpdate ?? [],
        onFinish: values.onFinish ?? [],
      };

      await mutateAsync(subscriptions);
    } catch (error) {
      emitError(`Error setting OSC: ${error}`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.sectionContainer} id='osc-subscriptions'>
      <OscSubscriptionRow
        cycle={TimerLifeCycle.onLoad}
        title={sectionText.onLoad.title}
        subtitle={sectionText.onLoad.subtitle}
        visible={showSection === TimerLifeCycle.onLoad}
        setShowSection={setShowSection}
        register={register}
        control={control}
      />
      <OscSubscriptionRow
        cycle={TimerLifeCycle.onStart}
        title={sectionText.onStart.title}
        subtitle={sectionText.onStart.subtitle}
        visible={showSection === TimerLifeCycle.onStart}
        setShowSection={setShowSection}
        register={register}
        control={control}
      />
      <OscSubscriptionRow
        cycle={TimerLifeCycle.onPause}
        title={sectionText.onPause.title}
        subtitle={sectionText.onPause.subtitle}
        visible={showSection === TimerLifeCycle.onPause}
        setShowSection={setShowSection}
        register={register}
        control={control}
      />
      <OscSubscriptionRow
        cycle={TimerLifeCycle.onStop}
        title={sectionText.onStop.title}
        subtitle={sectionText.onStop.subtitle}
        visible={showSection === TimerLifeCycle.onStop}
        setShowSection={setShowSection}
        register={register}
        control={control}
      />
      <OscSubscriptionRow
        cycle={TimerLifeCycle.onUpdate}
        title={sectionText.onUpdate.title}
        subtitle={sectionText.onUpdate.subtitle}
        visible={showSection === TimerLifeCycle.onUpdate}
        setShowSection={setShowSection}
        register={register}
        control={control}
      />
      <OscSubscriptionRow
        cycle={TimerLifeCycle.onFinish}
        title={sectionText.onFinish.title}
        subtitle={sectionText.onFinish.subtitle}
        visible={showSection === TimerLifeCycle.onFinish}
        setShowSection={setShowSection}
        register={register}
        control={control}
      />
      <OntimeModalFooter
        formId='osc-subscriptions'
        handleRevert={resetForm}
        isDirty={isDirty}
        isValid={isValid}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}
