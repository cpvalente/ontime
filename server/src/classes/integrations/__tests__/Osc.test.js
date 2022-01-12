import { OSCIntegration } from '../Osc';
import { Server } from 'node-osc';

test('Class initialises correctly', () => {
  const osc = new OSCIntegration();
  expect(osc.ADDRESS).toBe('/ontime');
  expect(osc.oscClient).toBe(null);

  // defined objects
  expect(osc.implemented.play).toBeDefined();
  expect(osc.implemented.pause).toBeDefined();
  expect(osc.implemented.stop).toBeDefined();
  expect(osc.implemented.previous).toBeDefined();
  expect(osc.implemented.next).toBeDefined();
  expect(osc.implemented.reload).toBeDefined();
  expect(osc.implemented.finished).toBeDefined();
  expect(osc.implemented.time).toBeDefined();
  expect(osc.implemented.overtime).toBeDefined();
  expect(osc.implemented.title).toBeDefined();
  expect(osc.implemented.eventNumber).toBeDefined();
  expect(osc.implemented.presenter).toBeDefined();

  // initialise client succeeds
  const { ip, port } = { ip: '127.0.0.1', port: 12345 };
  const init = osc.init({ ip, port });
  expect(init.message).toBe(`Initialised OSC Client at ${ip}:${port}`);
  expect(init.success).toBe(true);
  expect(osc.oscClient).not.toBe(null);

  // object shutdown as expected
  osc.shutdown();
  expect(osc.oscClient).toBe(null);
});

describe('OSC fails to initialise when incorrect data is given', () => {
  test('IP of wrong type', () => {
    const osc = new OSCIntegration();
    const init = osc.init({ ip: 123, port: 8888 });
    expect(init.message).toBe('Config options incorrect');
    expect(init.success).toBe(false);
    expect(osc.oscClient).toBe(null);
  });

  test('IP is null', () => {
    const osc = new OSCIntegration();
    const init = osc.init({ ip: null, port: 8888 });
    expect(init.message).toBe('Config options incorrect');
    expect(init.success).toBe(false);
    expect(osc.oscClient).toBe(null);
  });

  test('Port of wrong type', () => {
    const osc = new OSCIntegration();
    const init = osc.init({ ip: 'localhost', port: 'test' });
    expect(init.message).toBe('Config options incorrect');
    expect(init.success).toBe(false);
    expect(osc.oscClient).toBe(null);
  });

  test('Port is null', () => {
    const osc = new OSCIntegration();
    const init = osc.init({ ip: 'localhost', port: null });
    expect(init.message).toBe('Config options incorrect');
    expect(init.success).toBe(false);
    expect(osc.oscClient).toBe(null);
  });
});

test('Test messages sending', async () => {
  const testPort = 9999;
  const testIP = 'localhost';
  const testPayload = 'test';
  const osc = new OSCIntegration();

  const messages = [];

  // prepare dummy server to receive messages
  const oscServer = new Server(testPort, testIP);

  oscServer.on('message', (m) => {
    messages.push({ yay: m });
  });

  // try and send a message before initialising
  const test = await osc.send('test');
  expect(test.success).toBe(false);
  expect(test.message).toBe('Client not initialised');

  // initialise osc
  osc.init({ ip: testIP, port: testPort });

  // try and send unrecognised message
  const test2 = await osc.send('test');
  expect(test2.success).toBe(true);

  // send play message
  const playAddress = osc.implemented.play;
  const playSent = await osc.send(playAddress);
  expect(playSent.success).toBe(true);

  // send pause message
  const pauseAddress = osc.implemented.pause;
  const pauseSent = await osc.send(pauseAddress);
  expect(pauseSent.success).toBe(true);

  // send stop message
  const stopAddress = osc.implemented.stop;
  const stopSent = await osc.send(stopAddress);
  expect(stopSent.success).toBe(true);

  // send previous message
  const previousAddress = osc.implemented.previous;
  const previousSent = await osc.send(previousAddress);
  expect(previousSent.success).toBe(true);

  // send next message
  const nextAddress = osc.implemented.next;
  const nextSent = await osc.send(nextAddress);
  expect(nextSent.success).toBe(true);

  // send reload message
  const reloadAddress = osc.implemented.reload;
  const reloadSent = await osc.send(reloadAddress);
  expect(reloadSent.success).toBe(true);

  // send finished message
  const finishedAddress = osc.implemented.finished;
  const finishedSent = await osc.send(finishedAddress);
  expect(finishedSent.success).toBe(true);

  // send time message
  const timeAddress = osc.implemented.time;
  const timeSent = await osc.send(timeAddress);
  expect(timeSent.success).toBe(true);

  // send overtime message
  const overtimeAddress = osc.implemented.overtime;
  const overtimeSent = await osc.send(overtimeAddress, testPayload);
  expect(overtimeSent.success).toBe(true);

  // send title message
  const titleAddress = osc.implemented.title;
  const titleSent = await osc.send(titleAddress, testPayload);
  expect(titleSent.success).toBe(true);

  // send eventNumber message
  const eventNumberAddress = osc.implemented.eventNumber;
  const eventNumberSent = await osc.send(eventNumberAddress, testPayload);
  expect(eventNumberSent.success).toBe(true);

  // send timer message
  const presenterAddress = osc.implemented.presenter;
  const presenterSent = await osc.send(presenterAddress, testPayload);
  expect(presenterSent.success).toBe(true);

  // cleanup
  await osc.shutdown();
  await oscServer.close();

  // see messagesObject
  // expect(messages.length).toBe(5);
});
