import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Alias } from 'ontime-types';

import useAliases from '../../../../common/hooks-query/useAliases';
import ModalLoader from '../../../../features/modals/modal-loader/ModalLoader';
import * as Panel from '../PanelUtils';

import UrlAliasListItem from './UrlAliasListItem';

type Aliases = {
  aliases: Alias[];
};

export default function UrlAliasList() {
  const { data, status, isFetching } = useAliases();

  // const { emitError } = useEmitLog();
  const {
    control,
    // handleSubmit,
    register,
    reset,
    formState: { isSubmitting, isDirty, isValid },
  } = useForm<Aliases>({
    defaultValues: { aliases: data },
    values: { aliases: data || [] },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  console.log({ isSubmitting, isDirty, isValid, data });

  const { fields, remove } = useFieldArray({
    name: 'aliases',
    control,
  });

  useEffect(() => {
    if (data) {
      reset({ aliases: data });
    }
  }, [data, reset]);

  // const onReset = () => {
  //   reset({ aliases: data });
  // };

  // const addNew = () => {
  //   if (fields.length > 20) {
  //     emitError('Maximum amount of aliases reached (20)');
  //     return;
  //   }
  //   append({
  //     enabled: false,
  //     alias: '',
  //     pathAndParams: '',
  //   });
  // };

  const disableInputs = status === 'pending';
  // const hasTooManyOptions = fields.length >= 20;

  console.log('bolama');
  console.log({ isFetching });

  if (isFetching) {
    return <ModalLoader />;
  }

  return (
    <Panel.Table>
      <thead>
        <tr>
          <th>Alias</th>
          <th>Path and Params</th>
          <th>Enabled</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {fields.map((alias) => {
          return (
            <UrlAliasListItem
              alias={alias.alias}
              enabled={alias.enabled}
              pathAndParams={alias.pathAndParams}
              key={alias.id}
            />
          );
        })}
      </tbody>
    </Panel.Table>
  );
}
