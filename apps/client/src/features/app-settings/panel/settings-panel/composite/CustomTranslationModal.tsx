import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { maybeAxiosError } from '../../../../../common/api/utils';
import Button from '../../../../../common/components/buttons/Button';
import Input from '../../../../../common/components/input/input/Input';
import Modal from '../../../../../common/components/modal/Modal';
import { langEn, TranslationObject } from '../../../../../translation/languages/en';
import { useTranslation } from '../../../../../translation/TranslationProvider';
import * as Panel from '../../../panel-utils/PanelUtils';

interface CustomTranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomTranslationModal({ isOpen, onClose }: CustomTranslationModalProps) {
  const { userTranslation, postUserTranslation } = useTranslation();

  const translationStructure = useMemo(() => getTranslationStructure(), []);

  const defaultValues = useMemo(() => {
    const values: Record<string, string> = {};
    translationStructure.forEach(({ translationKey, formKey }) => {
      values[formKey] = userTranslation[translationKey as keyof TranslationObject] || '';
    });
    return values;
  }, [userTranslation, translationStructure]);

  const {
    handleSubmit,
    register,
    reset,
    formState: { isSubmitting, isDirty, errors },
    setError,
  } = useForm({
    defaultValues,
    resetOptions: {
      keepDirtyValues: true,
    },
    mode: 'onChange',
  });

  const onSubmit = async (formData: Record<string, string>) => {
    try {
      const translationData: Record<string, string> = {};
      translationStructure.forEach(({ translationKey, formKey }) => {
        translationData[translationKey] = formData[formKey];
      });

      await postUserTranslation(translationData as TranslationObject);
      reset(formData);
    } catch (error) {
      setError('root', { message: maybeAxiosError(error) });
    }
  };

  return (
    <Modal
      title='Add Translations'
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton
      showBackdrop
      bodyElements={
        <Panel.Section as='form' onSubmit={handleSubmit(onSubmit)} id='custom-translations-form'>
          <Panel.ListGroup>
            <Panel.Card>
              {Array.from(translationStructure.values()).map(({ formKey, label, placeholder }) => (
                <Panel.ListItem key={formKey}>
                  <Panel.Field title={label} description='' />
                  <Input
                    maxLength={150}
                    {...register(formKey, {
                      required: 'This field is required',
                    })}
                    placeholder={placeholder}
                  />
                </Panel.ListItem>
              ))}
            </Panel.Card>
          </Panel.ListGroup>
        </Panel.Section>
      }
      footerElements={
        <div>
          {errors?.root && <Panel.Error>{errors.root.message}</Panel.Error>}
          <Panel.InlineElements align='apart'>
            <Panel.InlineElements>
              <Button size='large' onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant='primary'
                size='large'
                type='submit'
                form='custom-translations-form'
                disabled={isSubmitting || !isDirty}
                loading={isSubmitting}
              >
                Save changes
              </Button>
            </Panel.InlineElements>
          </Panel.InlineElements>
        </div>
      }
    />
  );
}

function getTranslationStructure() {
  const fields = new Map<
    string,
    {
      formKey: string;
      translationKey: string;
      label: string;
      placeholder: string;
    }
  >();

  Object.entries(langEn).forEach(([translationKey, value]) => {
    if (!fields.has(translationKey)) {
      fields.set(translationKey, {
        formKey: '',
        translationKey: '',
        label: '',
        placeholder: '',
      });
    }

    fields.get(translationKey)!.formKey = translationKey.split('.')[1];
    fields.get(translationKey)!.translationKey = translationKey;
    fields.get(translationKey)!.label = translationKey
      .split('.')[1]
      .split('_')
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(' ');
    fields.get(translationKey)!.placeholder = value;
  });

  return fields;
}
