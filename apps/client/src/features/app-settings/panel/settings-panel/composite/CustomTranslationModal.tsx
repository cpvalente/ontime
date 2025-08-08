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
  const { userTranslation, postUserTranslation, refetchTranslation: refetch } = useTranslation();

  const translationStructure = useMemo(() => getTranslationStructure(), []);

  const defaultValues = useMemo(() => {
    const values: Record<string, string> = {};
    translationStructure.forEach((fields) => {
      fields.forEach(({ formKey, translationKey }) => {
        values[formKey] = userTranslation[translationKey as keyof TranslationObject] || '';
      });
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
      translationStructure.forEach((fields) => {
        fields.forEach(({ formKey, translationKey }) => {
          translationData[translationKey] = formData[formKey];
        });
      });

      await postUserTranslation(translationData as TranslationObject);
      reset(formData);
    } catch (error) {
      setError('root', { message: maybeAxiosError(error) });
    } finally {
      await refetch();
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
          {Array.from(translationStructure.entries()).map(([category, fields]) => (
            <Panel.Card key={category}>
              <Panel.SubHeader>{category.charAt(0).toUpperCase() + category.slice(1)}</Panel.SubHeader>
              <Panel.ListGroup>
                {fields.map(({ formKey, label, placeholder }) => (
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
              </Panel.ListGroup>
            </Panel.Card>
          ))}
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
  const categories = new Map<
    string,
    Array<{
      formKey: string;
      translationKey: string;
      label: string;
      placeholder: string;
    }>
  >();

  Object.entries(langEn).forEach(([translationKey, value]) => {
    const [category, key] = translationKey.split('.');

    if (!categories.has(category)) {
      categories.set(category, []);
    }

    categories.get(category)!.push({
      formKey: key,
      translationKey,
      label: key
        .split('_')
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(' '),
      placeholder: value,
    });
  });

  return categories;
}
