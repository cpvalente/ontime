import { RadioGroup } from '@base-ui/react/radio-group';
import { type KeyboardEvent, type ReactNode, useId, useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import { RadioItem } from '../../../common/components/radio-group/RadioGroup';
import type { ParamField } from '../../../common/components/view-params-editor/viewParams.types';
import { ParamRows } from '../../../common/components/view-params-editor/ViewParamsSection';
import useCustomFields from '../../../common/hooks-query/useCustomFields';
import useTeleprompterSettings from '../../../common/hooks-query/useTeleprompterSettings';
import { cx } from '../../../common/utils/styleUtils';
import { getScriptSourceLabel } from '../../../common/utils/teleprompterScriptSource';
import type { TeleprompterRole } from '../teleprompter.options';

import linkStyle from '../../../common/components/link/app-link/AppLink.module.scss';
import style from './PlaybackOptions.module.scss';

const settingsPath = 'Settings › Teleprompter';
// a new tab, so the screen keeps its unapplied options
const settingsLink = (
  <Link to='/editor?settings=settings__teleprompter' target='_blank' rel='noreferrer' className={linkStyle.link}>
    {settingsPath}
  </Link>
);

const roleCards: { role: TeleprompterRole; title: string; summary: ReactNode }[] = [
  { role: 'local', title: 'Independent', summary: 'Scrolls on its own. Other screens are not affected.' },
  {
    role: 'controller',
    title: 'Controller',
    summary: <>Moves every Follower screen with it. Its script field is set in {settingsLink}.</>,
  },
  {
    role: 'remote',
    title: 'Follower',
    summary: <>Shows where the Controller is reading and cannot scroll. Its script field is set in {settingsLink}.</>,
  },
];

/** the radio group moves between roles with these keys, which the fields in a card need for themselves */
function keepKeysInFields(event: KeyboardEvent) {
  if (event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End') {
    event.stopPropagation();
  }
}

export default function PlaybackOptions({ options }: { options: ParamField[] }) {
  const [searchParams] = useSearchParams();
  const { data: settings } = useTeleprompterSettings();
  const { data: customFields } = useCustomFields();
  const idPrefix = useId();

  const [roleField, ...independentOptions] = options;
  const search = searchParams.toString();
  const fromUrl = searchParams.get(roleField.id);
  const applied = roleCards.find(({ role }) => role === fromUrl)?.role ?? 'local';
  // a role chosen and not applied, until the URL changes
  const [chosen, setChosen] = useState<{ search: string; role: TeleprompterRole } | null>(null);
  const selected = chosen?.search === search ? chosen.role : applied;

  const projectField = getScriptSourceLabel(settings.script, customFields);

  return (
    <RadioGroup
      name={roleField.id}
      value={selected}
      onValueChange={(role) => setChosen({ search, role: role as TeleprompterRole })}
      aria-label='Playback'
      className={style.cards}
    >
      {roleCards.map(({ role, title, summary }) => {
        const isSelected = role === selected;
        return (
          <section key={role} className={cx([style.card, isSelected && style.selected])}>
            <label className={style.cardHeader}>
              <RadioItem
                value={role}
                aria-labelledby={`${idPrefix}-${role}`}
                aria-describedby={`${idPrefix}-${role}-summary`}
              />
              <span id={`${idPrefix}-${role}`} className={style.title}>
                {title}
              </span>
              <span id={`${idPrefix}-${role}-summary`} className={style.summary}>
                {summary}
              </span>
            </label>
            <p aria-live='polite' className={style.unapplied}>
              {isSelected && selected !== applied && 'Not applied yet. Press Apply to use it.'}
            </p>
            {role === 'local' ? (
              // kept mounted while another role is chosen, so its values survive until it is chosen again
              <div
                role='group'
                aria-labelledby={`${idPrefix}-${role}`}
                className={cx([style.body, !isSelected && style.hidden])}
                onKeyDown={keepKeysInFields}
              >
                <ParamRows options={independentOptions} />
              </div>
            ) : (
              isSelected && (
                <div className={style.body}>
                  <ReadOnlyRow title='Script field' value={projectField} />
                  <ReadOnlyRow
                    title='Mode and speed'
                    value={role === 'controller' ? 'Set on this screen' : 'From a Controller'}
                    description={
                      role === 'controller'
                        ? 'Use the transport on this screen. Companion can also drive playback.'
                        : 'Set live by a Controller screen or Companion.'
                    }
                  />
                </div>
              )
            )}
          </section>
        );
      })}
    </RadioGroup>
  );
}

function ReadOnlyRow({ title, value, description }: { title: string; value: string; description?: string }) {
  return (
    <div className={style.readOnly}>
      <span className={style.title}>{title}</span>
      <span className={style.value}>{value}</span>
      {description && <span className={style.summary}>{description}</span>}
    </div>
  );
}
