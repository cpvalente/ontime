export type Message = {
  text: string;
  visible: boolean;
};

export type MessageControl = {
  presenter: Message;
  public: Message;
  lower: Message;
};
