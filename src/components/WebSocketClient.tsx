'use client';

import { useEffect, useState } from 'react';

const WebSocketClient = () => {
  const [status, setStatus] = useState('Disconnected');

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:6666');

    ws.onopen = () => {
      setStatus('Connected');
    };

    ws.onclose = () => {
      setStatus('Disconnected');
    };

    return () => {
      ws.close();
    };
  }, []);

  return <div>WebSocket Status: {status}</div>;
};

export default WebSocketClient;
