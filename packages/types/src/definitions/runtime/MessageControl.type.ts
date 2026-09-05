export type SecondarySource = 'aux1' | 'aux2' | 'aux3' | 'secondary' | null;

export type TimerMessage = {
  text: string;
  visible: boolean;
  blink: boolean;
  blackout: boolean;
  secondarySource: SecondarySource;
};

/**
 * A targeted question attached to the secondary message.
 * While enabled, the secondary message is only shown to the targeted client.
 */
export type MessageQuestion = {
  enabled: boolean;
  target: string | null;
  answers: string[];
  answer: string | null;
};

export type MessageState = {
  timer: TimerMessage;
  secondary: string;
  question: MessageQuestion;
};
