const socket = new WebSocket('ws://localhost:4001/ws');
const subscriptions = new Set();

export function subscribeOnce<T>(key: string, callback: (data: T) => void, requestString?: string) {
  if (subscriptions.has(key)) {
    return;
  }
  subscriptions.add(key);

  // requestString ? socket.send(requestString) : socket.send(`get-${key}`);
  // socket.on(key, callback);
}

export default socket;
