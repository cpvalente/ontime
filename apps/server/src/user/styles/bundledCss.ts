export const defaultCss = `
/** 
 * This CSS file allows user customisation of the UI
 * We expose some CSS properties to facilitate this (see below in :root)
 * In the cases where this is missing, you can add your selectors here
 */

:root {
  /** Background colour for the views */
  --background-color-override: #ececec;

  /** Main text colour for the views */
  --color-override: #101010;

  /** Text colour for the views */
  --secondary-color-override: #404040;

  /** Accent text colour, used on active elements */
  --accent-color-override: #fa5656;

  /** Label text colour, used on active elements */
  --label-color-override: #6c6c6c;

  /** Timer text colour */
  --timer-color-override: #202020;
  --timer-warning-color-override: #ffbc56;
  --timer-danger-color-override: #e69000;
  --timer-overtime-color-override: #fa5656;
  --timer-pending-color-override: #578AF4;

  /** Background for card elements on background */
  --card-background-color-override: #fff;

  /** Font used for all text in views */
  --font-family-override: 'Open Sans';

  /** Font used for clock in /minimal and /clock views */
  --font-family-bold-override: 'Arial Black';

  /** Colour used for external message and aux timer in /timer */
  --external-color-override: #161616;

  /** View specific features: /backstage */
  /** ---- Background highlight for blink behaviour */
  --card-background-color-blink-override: #339e4e;
  /** ---- Colour used for progress bar background */
  --timer-progress-bg-override: #fff;
  /** ---- Colour used for progress bar progress */
  --timer-progress-override: #202020;

  /** View specific features: /op */
  --operator-customfield-font-size-override: 1.25rem;
  --operator-running-bg-override: #339e4e;

  /** View specific features: /studio */
  --studio-active: #101010;
  --studio-idle: #cfcfcf;
  --studio-active-label: #101010;
  --studio-idle-label: #595959;
  --studio-overtime: #101010;

  /** View specific features: /lower */
  --lowerThird-font-family-override: 'Courier New';
  --lowerThird-top-font-weight-override: bold;
  --lowerThird-bottom-font-weight-override: bold;
  --lowerThird-top-font-style-override: normal;
  --lowerThird-bottom-font-style-override: italic;
  --lowerThird-line-height-override: 1vh;
  --lowerThird-text-align-override: end;
}

/** 
 * You can inspect the page in your browser and add the selectors here.
 * In the below example, we change the colour of the overlay message in the stage-timer view.
 */
.stage-timer > .message-overlay--active > div {
  color: red;
}
`;
