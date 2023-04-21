import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ModalBody } from '@chakra-ui/react';
import type { OSCSettings, OscSubscription } from 'ontime-types';
import { TimerLifeCycle } from 'ontime-types';
import { generateId } from 'ontime-utils';

import useOscSettings, { useOscSettingsMutation } from '../../../common/hooks-query/useOscSettings';
import { oscPlaceholderSettings, PlaceholderSettings } from '../../../common/models/OscSettings';
import { useEmitLog } from '../../../common/stores/logger';

import OntimeModalFooter from './OntimeModalFooter';
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
  const { mutateAsync } = useOscSettingsMutation();
  const { emitError } = useEmitLog();
  const {
    handleSubmit,
    register,
    reset,
    formState: { isSubmitting, isDirty, isValid },
  } = useForm<PlaceholderSettings>({
    defaultValues: data,
    values: data,
  });

  const [subscriptionState, setSubscription] = useState<OscSubscription>(
    data?.subscriptions || oscPlaceholderSettings.subscriptions,
  );
  const [hasManualChange, setHasManualChange] = useState(false);

  const [showSection, setShowSection] = useState<OntimeCycle>(TimerLifeCycle.onLoad);

  const resetForm = () => {
    const originalData = data || oscPlaceholderSettings;
    setSubscription(originalData.subscriptions);
    // @ts-expect-error -- we know the data here is safe
    reset(originalData);
  };

  const deleteSubscriptionEntry = (cycle: OntimeCycle, id: string) => {
    setSubscription((prev) => {
      const newData = { ...prev };
      newData[cycle] = [...prev[cycle].filter((el) => el.id !== id)];
      return newData;
    });
    setHasManualChange(true);
  };

  const addNewSubscriptionEntry = async (cycle: OntimeCycle) => {
    setSubscription((prev) => {
      const newData = structuredClone(prev);
      newData[cycle] = [...prev[cycle], { id: generateId(), message: '', enabled: false }];
      return newData;
    });
    setHasManualChange(true);
  };

  const onSubmit = async (values: OSCSettings | PlaceholderSettings) => {
    try {
      // @ts-expect-error -- we know of the type mismatch, not pertinent here
      await mutateAsync(values);
      setHasManualChange(false);
    } catch (error) {
      emitError(`Error setting OSC: ${error}`);
    }
  };

  const subscriptionKeys = Object.keys(subscriptionState);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.sectionContainer} id='oscSubscriptions'>
      <ModalBody>
        {subscriptionKeys.map((cycle, idx) => {
          return (
            <>
              <OscSubscriptionRow
                key={cycle}
                cycle={cycle as TimerLifeCycle}
                title={sectionText[cycle as TimerLifeCycle].title}
                subtitle={sectionText[cycle as TimerLifeCycle].subtitle}
                visible={showSection === cycle}
                setShowSection={setShowSection}
                subscriptionOptions={subscriptionState[cycle as TimerLifeCycle]}
                handleDelete={deleteSubscriptionEntry}
                handleAddNew={addNewSubscriptionEntry}
                register={register}
              />
              {idx < subscriptionKeys.length - 1 && <hr className={styles.divider} />}
            </>
          );
        })}
      </ModalBody>
      <OntimeModalFooter
        formId='oscSubscriptions'
        handleRevert={resetForm}
        isDirty={isDirty || hasManualChange}
        isValid={isValid}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}
