import { useRef } from 'react';
import { type FieldArrayWithId, type UseFormSetValue } from 'react-hook-form';
import { IoAdd, IoTrash } from 'react-icons/io5';

import Button from '../../../../../../common/components/buttons/Button';
import IconButton from '../../../../../../common/components/buttons/IconButton';
import Checkbox from '../../../../../../common/components/checkbox/Checkbox';
import * as Panel from '../../../../panel-utils/PanelUtils';
import {
  type ImportFormValues,
  type MappingWarning,
  builtInFieldDefs,
  getResolvedCustomFields,
} from './importMapUtils';
import MappingFieldRow from './MappingFieldRow';

import style from './SheetImportEditor.module.scss';

interface SheetImportMappingPaneProps {
  values: ImportFormValues;
  setValue: UseFormSetValue<ImportFormValues>;
  warnings: Record<string, MappingWarning | undefined>;
  sampleHeaders: string[];
  assignedHeaders: Set<string>;
  fields: FieldArrayWithId<ImportFormValues, 'custom', 'id'>[];
  addCustomField: () => void;
  removeCustomField: (index: number) => void;
  isBusy: boolean;
}

export default function SheetImportMappingPane({
  values,
  setValue,
  warnings,
  sampleHeaders,
  assignedHeaders,
  fields,
  addCustomField,
  removeCustomField,
  isBusy,
}: SheetImportMappingPaneProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const resolvedCustomFields = getResolvedCustomFields(values.custom);

  const handleAddCustomField = () => {
    addCustomField();
    requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }));
  };

  return (
    <section className={style.mappingPane}>
      <Panel.InlineElements align='apart' className={style.mappingPaneHeader}>
        <span className={style.mappingPaneTitle}>Fields</span>
        <Panel.InlineElements relation='inner' className={style.mappingPaneActions}>
          <Button className={style.addColumnTrigger} onClick={handleAddCustomField} disabled={isBusy}>
            <IoAdd />
            Add
          </Button>
        </Panel.InlineElements>
      </Panel.InlineElements>

      <div ref={listRef} className={style.mappingList}>
        {builtInFieldDefs.map((def, index) => (
          <MappingFieldRow
            key={def.importKey}
            header={
              <label className={style.mappingFieldTitle}>
                <Checkbox
                  checked={values.builtIn[index]?.enabled !== false}
                  onCheckedChange={(next) =>
                    setValue(`builtIn.${index}.enabled`, next === true, { shouldDirty: true, shouldValidate: true })
                  }
                />
                <span className={style.mappingFieldLabel}>{def.label}</span>
              </label>
            }
            value={values.builtIn[index]?.header ?? ''}
            onValueChange={(nextValue) =>
              setValue(`builtIn.${index}.header`, nextValue, { shouldDirty: true, shouldValidate: true })
            }
            warning={values.builtIn[index]?.enabled !== false ? warnings[`builtIn.${index}.header`] : undefined}
            options={sampleHeaders}
            assigned={assignedHeaders}
            disabled={values.builtIn[index]?.enabled === false}
          />
        ))}

        {fields.map((field, index) => (
          <MappingFieldRow
            key={field.id}
            header={
              <div className={style.mappingFieldHeader}>
                <span className={style.mappingFieldLabel}>
                  {resolvedCustomFields[index]?.ontimeName || values.custom[index]?.importName || `Custom ${index + 1}`}
                </span>
                <IconButton
                  variant='ghosted-destructive'
                  aria-label={`Delete custom column ${resolvedCustomFields[index]?.ontimeName || values.custom[index]?.importName || `Custom ${index + 1}`}`}
                  onClick={() => removeCustomField(index)}
                >
                  <IoTrash />
                </IconButton>
              </div>
            }
            value={values.custom[index]?.importName ?? ''}
            onValueChange={(nextValue) => {
              setValue(`custom.${index}.importName`, nextValue, { shouldDirty: true, shouldValidate: true });
              setValue(`custom.${index}.ontimeName`, '', { shouldDirty: true, shouldValidate: true });
            }}
            warning={warnings[`custom.${index}.importName`]}
            options={sampleHeaders}
            assigned={assignedHeaders}
          />
        ))}
      </div>
    </section>
  );
}
