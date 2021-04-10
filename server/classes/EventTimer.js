const Timer = require('./Timer');

/*
 * EventTimer adds functions specific to APP
 * namely:
 * - Presenter message, text and status
 * - Public message, text and status
 *
 */

class EventTimer extends Timer {
  presenter = {
    text: '',
    visible: false,
  };
  public = {
    text: '',
    visible: false,
  };

  constructor() {
    super();
  }

  set presenterText(text) {
    this.presenter.text = text;
  }

  set presenterVisible(state) {
    this.presenter.visible = state;
  }

  set publicText(text) {
    this.public.text = text;
  }

  set publicVisible(state) {
    this.public.visible = state;
  }

  get presenter() {
    return this.presenter;
  }

  get public() {
    return this.public;
  }

}

module.exports = EventTimer;
