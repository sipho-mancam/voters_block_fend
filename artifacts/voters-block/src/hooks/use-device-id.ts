import { useEffect, useState } from 'react';

function generateDeviceId() {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    let id = localStorage.getItem('voters_block_device_id');
    if (!id) {
      id = generateDeviceId();
      localStorage.setItem('voters_block_device_id', id);
    }
    setDeviceId(id);
  }, []);

  return deviceId;
}
