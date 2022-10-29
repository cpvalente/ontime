let instance;

class MessageManager {
  constructor() {
    if (instance) {
      throw new Error('There can be only one');
    }
    instance = this;
    this.socket = null;

    this.presenter = {
      text: '',
      visible: false,
    };
    this.public = {
      text: '',
      visible: false,
    };
    this.lower = {
      text: '',
      visible: false,
    };
    this.onAir = false;
  }

  /**
   * @description sets message on stage timer screen
   * @param payload {string}
   */
  setTimerText(payload) {
    this.presenter.text = payload;
    return this.getAll();
  }

  /**
   * @description sets message visibility on stage timer screen
   * @param status {boolean}
   */
  setTimerVisibility(status) {
    this.presenter.visible = status;
    return this.getAll();
  }

  /**
   * @description sets message on public screen
   * @param payload {string}
   */
  setPublicText(payload) {
    this.public.text = payload;
    return this.getAll();
  }

  /**
   * @description sets message visibility on public screen
   * @param status {boolean}
   */
  setPublicVisibility(status) {
    this.public.visible = status;
    return this.getAll();
  }

  /**
   * @description sets message on lower third screen
   * @param payload {string}
   */
  setLowerText(payload) {
    this.lower.text = payload;
    return this.getAll();
  }

  /**
   * @description sets message visibility on lower third screen
   * @param status {boolean}
   */
  setLowerVisibility(status) {
    this.lower.visible = status;
    return this.getAll();
  }

  /**
   * @description set state of onAir
   * @param status {boolean}
   */
  setOnAir(status) {
    this.onAir = status;
    return this.getAll();
  }

  /**
   * @description Returns feature data
   */
  getAll() {
    return {
      presenter: this.presenter,
      public: this.public,
      lower: this.lower,
      onAir: this.onAir,
    };
  }
}

export const messageManager = new MessageManager();
