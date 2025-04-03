export const defaultCss = `
/** 
 * This CSS file allows user customisation of the UI
 * We expose some CSS properties to facilitate this (see below in :root)
 * In the cases where this is missing, you can add your selectors here
 */

:root {
  /** Background colour for the views */
  --background-color-override: #101010;

  /** Main text colour for the views */
  --color-override: rgba(white, 80%);

  /** Text colour for the views */
  --secondary-color-override: rgba(white, 45%);

  /** Accent text colour, used on active elements */
  --accent-color-override: #fa5656;

  /** Label text colour, used on active elements */
  --label-color-override: rgba(white, 25%);

  /** Timer text colour */
  --timer-color-override: rgba(white, 80%);
  --timer-warning-color-override: #ffbc56;
  --timer-danger-color-override: #e69000;
  --timer-overtime-color-override: #fa5656;
  --timer-pending-color-override: #578AF4;

  /** Background for card elements on background */
  --card-background-color-override: rgba(white, 7%);

  /** Font used for all text in views */
  --font-family-override: 'Open Sans', 'Segoe UI', sans-serif;

  /** Font used for clock in /minimal and /clock views */
  --font-family-bold-override: 'Arial Black', sans-serif;

  /** Colour used for external message and aux timer in /timer */
  --external-color-override: rgba(white, 85%);

  /** View specific features: /backstage */
  /** ---- Background highlight for blink behaviour */
  --card-background-color-blink-override: #339e4e;
  /** ---- Colour used for progress bar background */
  --timer-progress-bg-override: rgba(white, 7%);
  /** ---- Colour used for progress bar progress */
  --timer-progress-override: #fa5656;

  /** View specific features: /op */
  --operator-customfield-font-size-override: 1.25rem;
  --operator-running-bg-override: #d20300;

  /** View specific features: /studio */
  --studio-active: #d20300;
  --studio-idle: #360000;
  --studio-active-label: #0ff;
  --studio-idle-label: #0aa;
  --studio-overtime: #f60;

  /** View specific features: /lower */
  --lowerThird-font-family-override: 'Lato', 'Arial', sans-serif;
  --lowerThird-top-font-weight-override: 600;
  --lowerThird-bottom-font-weight-override: normal;
  --lowerThird-top-font-style-override: normal;
  --lowerThird-bottom-font-style-override: normal;
  --lowerThird-line-height-override: 1vh;
  --lowerThird-text-align-override: left;
}

/** 
 * You can inspect the page in your browser and add the selectors here.
 * In the below example, we change the colour of the overlay message in the stage-timer view.
 */
.stage-timer > .message-overlay--active > div {
  color: red;
}
`;
