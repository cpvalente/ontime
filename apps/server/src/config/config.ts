export const timerConfig = {
  skipLimit: 1000, // threshold of skip for recalculating
  updateRate: 32, // how often do we update the timer
  notificationRate: 1000, // how often do we notify clients and integrations
  triggerAhead: 10, // how far ahead do we trigger the end event
};
