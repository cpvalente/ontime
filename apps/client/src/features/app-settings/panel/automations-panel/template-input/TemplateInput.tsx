import { Autocomplete as BaseAutocomplete } from '@base-ui/react/autocomplete';
import type { ChangeEvent, ReactNode, Ref } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IoExpandOutline } from 'react-icons/io5';

import Button from '../../../../../common/components/buttons/Button';
import IconButton from '../../../../../common/components/buttons/IconButton';
import { type InputProps } from '../../../../../common/components/input/input/Input';
import Textarea from '../../../../../common/components/input/textarea/Textarea';
import Modal from '../../../../../common/components/modal/Modal';
import useCustomFields from '../../../../../common/hooks-query/useCustomFields';
import { cx } from '../../../../../common/utils/styleUtils';
import { makeAutoCompleteList } from './templateInput.utils';
import { useTemplateAutocomplete } from './useTemplateAutocomplete';

import inputStyle from '../../../../../common/components/input/input/Input.module.scss';
import style from './TemplateInput.module.scss';

interface TemplateInputProps extends Omit<InputProps, 'value'> {
  ref?: Ref<HTMLInputElement>;
  value?: string;
}

interface TemplateEditorModalProps {
  autocompleteList: string[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  value: string;
}

type TemplateAutocompleteState = ReturnType<typeof useTemplateAutocomplete<HTMLInputElement>>;

interface TemplateAutocompleteRootProps {
  autocomplete: TemplateAutocompleteState;
  children: ReactNode;
  value: string;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

function emitInputChange(name: string | undefined, value: string, onChange: InputProps['onChange']) {
  onChange?.({
    target: { name, value },
    currentTarget: { name, value },
  } as ChangeEvent<HTMLInputElement>);
}

export default function TemplateInput({
  className,
  disabled,
  fluid,
  height = 'medium',
  onChange,
  readOnly,
  ref,
  value,
  variant = 'subtle',
  ...rest
}: TemplateInputProps) {
  const { data } = useCustomFields();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [inputValue, setInputValue] = useState(value || '');
  const [isExpanded, setIsExpanded] = useState(false);

  const autocompleteList = useMemo(() => {
    return makeAutoCompleteList(data);
  }, [data]);

  const updateInputValue = useCallback(
    (nextValue: string) => {
      setInputValue(nextValue);
      emitInputChange(rest.name, nextValue, onChange);
    },
    [onChange, rest.name],
  );

  const autocomplete = useTemplateAutocomplete(inputValue, autocompleteList, inputRef, updateInputValue);
  const { setCursorForValue } = autocomplete;

  // Keep the local autocomplete input in sync when react-hook-form resets or swaps field-array values.
  useEffect(() => {
    const nextValue = value || '';
    setInputValue(nextValue);
    setCursorForValue(nextValue, nextValue.length);
  }, [setCursorForValue, value]);

  const setInputRef = useCallback(
    (element: HTMLInputElement | null) => {
      inputRef.current = element;
      assignRef(ref, element);
    },
    [ref],
  );

  const openExpandedEditor = () => {
    autocomplete.setShowSuggestions(false);
    setIsExpanded(true);
  };

  const closeExpandedEditor = () => {
    setIsExpanded(false);
  };

  const saveExpandedEditor = (nextValue: string) => {
    updateInputValue(nextValue);
    autocomplete.setCursorForValue(nextValue, nextValue.length);
    setIsExpanded(false);
  };

  return (
    <>
      <TemplateAutocompleteRoot autocomplete={autocomplete} value={inputValue}>
        <div className={cx([style.inputShell, fluid && style.fluid])}>
          <BaseAutocomplete.Input
            ref={setInputRef}
            className={cx([
              inputStyle.input,
              inputStyle[variant],
              inputStyle[height],
              fluid && inputStyle.fluid,
              style.input,
              className,
            ])}
            {...rest}
            disabled={disabled}
            onClick={autocomplete.updateCursor}
            onFocus={autocomplete.updateCursor}
            onKeyUp={autocomplete.updateCursor}
            onSelect={autocomplete.updateCursor}
            readOnly={readOnly}
          />
          <IconButton
            aria-label='Expand template editor'
            className={style.expandButton}
            disabled={disabled || readOnly}
            onClick={openExpandedEditor}
            size='small'
            title='Expand template editor'
            variant='ghosted-white'
          >
            <IoExpandOutline />
          </IconButton>
        </div>
      </TemplateAutocompleteRoot>
      <TemplateEditorModal
        autocompleteList={autocompleteList}
        isOpen={isExpanded}
        onClose={closeExpandedEditor}
        onSave={saveExpandedEditor}
        value={inputValue}
      />
    </>
  );
}

function TemplateAutocompleteRoot({ autocomplete, children, value }: TemplateAutocompleteRootProps) {
  return (
    <BaseAutocomplete.Root
      items={autocomplete.suggestions}
      autoHighlight
      highlightItemOnHover
      mode='none'
      open={autocomplete.open}
      value={value}
      onOpenChange={autocomplete.setShowSuggestions}
      onValueChange={autocomplete.handleValueChange}
    >
      {children}
      <TemplateSuggestionPopup />
    </BaseAutocomplete.Root>
  );
}

function TemplateEditorModal({ autocompleteList, isOpen, onClose, onSave, value }: TemplateEditorModalProps) {
  const expandedInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [draftValue, setDraftValue] = useState(value);
  const autocomplete = useTemplateAutocomplete(draftValue, autocompleteList, expandedInputRef, setDraftValue);
  const { setShowSuggestions } = autocomplete;

  // Reset the draft whenever the modal opens so cancel never leaks unsaved changes.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftValue(value);
    setShowSuggestions(false);
  }, [isOpen, setShowSuggestions, value]);

  const handleClose = () => {
    setShowSuggestions(false);
    onClose();
  };

  const handleSave = () => {
    setShowSuggestions(false);
    onSave(draftValue);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      showBackdrop
      showCloseButton
      title='Edit template'
      bodyElements={
        <TemplateAutocompleteRoot autocomplete={autocomplete} value={draftValue}>
          <BaseAutocomplete.Input
            autoFocus
            className={style.expandedEditor}
            onClick={autocomplete.updateCursor}
            onFocus={autocomplete.updateCursor}
            onKeyUp={autocomplete.updateCursor}
            onSelect={autocomplete.updateCursor}
            render={<Textarea ref={expandedInputRef} fluid resize='none' rows={8} />}
          />
        </TemplateAutocompleteRoot>
      }
      footerElements={
        <>
          <span className={style.footerHint}>Start a template with {'{{'} to see autocomplete.</span>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant='primary'>
            Save
          </Button>
        </>
      }
    />
  );
}

function TemplateSuggestionPopup() {
  return (
    <BaseAutocomplete.Portal>
      <BaseAutocomplete.Positioner side='bottom' align='start' className={style.positioner}>
        <BaseAutocomplete.Popup className={style.popup}>
          <BaseAutocomplete.List className={style.list}>
            <BaseAutocomplete.Collection>
              {(suggestion: string) => (
                <BaseAutocomplete.Item key={suggestion} value={suggestion} className={style.item}>
                  {suggestion}
                </BaseAutocomplete.Item>
              )}
            </BaseAutocomplete.Collection>
          </BaseAutocomplete.List>
        </BaseAutocomplete.Popup>
      </BaseAutocomplete.Positioner>
    </BaseAutocomplete.Portal>
  );
}
