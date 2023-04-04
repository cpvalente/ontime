// Exported viewer link location
const minimalLocation = 'minimal';
const speakerLocation = 'speaker';
const smLocation = 'sm';
const publicLocation = 'public';
const studioLocation = 'studio';
const cuesheetLocation = 'cuesheet';
const countdownLocation = 'countdown';
const clockLocation = 'clock';
const lowerLocation = 'lower';

export const viewerLocations = [
  { link: speakerLocation, label: 'Stage timer' },
  { link: clockLocation, label: 'Clock' },
  { link: minimalLocation, label: 'Minimal timer' },
  { link: smLocation, label: 'Backstage screen' },
  { link: publicLocation, label: 'Public screen' },
  { link: lowerLocation, label: 'Lower thirds' },
  { link: studioLocation, label: 'Studio clock' },
  { link: countdownLocation, label: 'Countdown' },
  { link: cuesheetLocation, label: 'Cuesheet' },
];
