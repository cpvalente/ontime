import useWebSocket from 'react-use-websocket';

export default function useSocketClient() {
  const { sendJsonMessage, lastMessage, lastJsonMessage, readyState } = useWebSocket('_emit:4001', {
    share: true,
    shouldReconnect: () => true,
    onClose: () => console.log('closed socket connection'),
    onError: () => console.log('error in socket connection'),
  });

  console.log('debug messages', lastMessage);
  console.log('debug JSON messages', lastJsonMessage);

  return { sendJsonMessage, lastJsonMessage, lastMessage, readyState };
}
