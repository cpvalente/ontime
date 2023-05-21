export type Message = {
  text: string;
  visible: boolean;
};

export type TimerMessage = {
  text: string;
  visible: boolean;
  timerBlink: boolean;
  timerBlackout: boolean;
}
