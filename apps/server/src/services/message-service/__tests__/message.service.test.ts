import { RuntimeStore } from 'ontime-types';

import * as messageService from '../message.service.js';

describe('MessageService', () => {
  let store: Partial<RuntimeStore>;
  beforeEach(() => {
    // at runtime, the store is instantiated before the message service
    store = {};
    messageService.init(
      (key, value) => (store[key] = value),
      (key) => store[key],
    );
    messageService.clear();
  });

  it('should patch the message state', () => {
    const newState = messageService.patch({
      timer: { text: 'new text', visible: true },
      secondary: 'secondary',
    });

    expect(newState).toMatchObject({
      timer: { text: 'new text', visible: true, blackout: false, blink: false, secondarySource: null },
      secondary: 'secondary',
    });
  });

  it('should not affect other properties when patching', () => {
    const newState = messageService.patch({
      timer: { text: 'initial text', visible: true },
    });

    expect(newState).toMatchObject({
      timer: { text: 'initial text', visible: true, blackout: false, blink: false, secondarySource: null },
      secondary: '',
    });
  });

  it('always clears the answer when a patch explicitly enables the question', () => {
    // even though this same patch also sets an answer, enabling always wins and resets it
    const state = messageService.patch({ question: { enabled: true, answer: 'Yes' } });
    expect(state.question.answer).toBeNull();
  });

  it('leaves the answer untouched when the patch does not enable the question', () => {
    messageService.patch({ question: { enabled: true, target: 'client-1', answers: ['Yes', 'No'] } });
    const state = messageService.patch({ question: { answer: 'No' } });
    expect(state.question.answer).toEqual('No');
  });

  describe('recordAnswer()', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      // re-init with a fresh, fake-timer-aware throttle. The outer beforeEach's clear() already
      // reset the store data for real, but it also consumed the throttle's leading-edge slot using
      // a real setTimeout scheduled before fake timers were installed - vi.advanceTimersByTime can
      // never flush that one, so every write in this block would otherwise sit queued forever.
      messageService.init(
        (key, value) => (store[key] = value),
        (key) => store[key],
      );
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function armQuestion(target = 'client-1', answers = ['Yes', 'No', '']) {
      return messageService.patch({
        question: { enabled: true, target, answers, answer: null },
        timer: { secondarySource: 'secondary' },
      });
    }

    it('throws if there is no active question', () => {
      expect(() => messageService.recordAnswer('Yes')).toThrow();
    });

    it('throws if the question has already been answered', () => {
      armQuestion();
      messageService.recordAnswer('Yes');
      // let the first answer's (queued) write actually land before the second call checks for it
      vi.advanceTimersByTime(100);
      expect(() => messageService.recordAnswer('No')).toThrow();
    });

    it('accepts the answer when clientId matches the targeted client', () => {
      armQuestion('client-1');
      const state = messageService.recordAnswer('Yes', 'client-1');
      expect(state.question.answer).toEqual('Yes');
    });

    it('rejects the answer when clientId does not match the targeted client', () => {
      armQuestion('client-1');
      expect(() => messageService.recordAnswer('Yes', 'someone-else')).toThrow();
    });

    it('accepts the answer regardless of target when no clientId is given (eg OSC/HTTP callers)', () => {
      armQuestion('client-1');
      const state = messageService.recordAnswer('Yes');
      expect(state.question.answer).toEqual('Yes');
    });

    it('records the answer immediately, without clearing the question yet', () => {
      armQuestion();
      const state = messageService.recordAnswer('Yes');

      expect(state.question).toMatchObject({ enabled: true, answer: 'Yes' });
      expect(state.timer.secondarySource).toEqual('secondary');
    });

    it('clears the question after the hold delay, leaving the answer visible', () => {
      armQuestion();
      messageService.recordAnswer('Yes');

      vi.advanceTimersByTime(2000);

      const state = messageService.getState();
      expect(state.question.enabled).toEqual(false);
      expect(state.timer.secondarySource).toBeNull();
      expect(state.question.answer).toEqual('Yes');
    });

    it('does not clear the question if it was dismissed before the hold delay', () => {
      armQuestion();
      messageService.recordAnswer('Yes');

      // a manual dismiss, same as the controller clicking the ? icon
      messageService.patch({ question: { enabled: false, answer: null }, timer: { secondarySource: null } });
      vi.advanceTimersByTime(2000);

      const state = messageService.getState();
      expect(state.question).toMatchObject({ enabled: false, answer: null });
    });

    it('does not let a stale timeout clear a newer answer, even with the same value', () => {
      armQuestion();
      messageService.recordAnswer('Yes'); // scheduled to clear at t=2000

      vi.advanceTimersByTime(500);
      messageService.patch({ question: { enabled: true } }); // re-arm, clears the first answer
      messageService.recordAnswer('Yes'); // scheduled to clear at t=2500

      // t=2000: the first (stale) timeout must not clear the second answer early
      vi.advanceTimersByTime(1500);
      expect(messageService.getState().question.enabled).toEqual(true);

      // t=2500: the second (current) timeout fires for real
      vi.advanceTimersByTime(500);
      expect(messageService.getState().question.enabled).toEqual(false);
    });
  });
});
