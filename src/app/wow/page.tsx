"use client";
import { useEffect, useState } from 'react';

interface Van {
  id: number;
  van_id: number;
  operator_id: number;
  assigned_at: string;
  status: 'idle' | 'queued' | 'waiting' | 'departed' | 'arrived';
  queued_at?: string; // Add this field to store the time when the van was queued
}

export default function Home() {
  const [vans, setVans] = useState<Van[]>([]);
  const [queuedVans, setQueuedVans] = useState<Van[]>([]);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchAndUpdateVans();
  }, []);

  useEffect(() => {
    if (queuedVans.length > 0) {
      const id = setInterval(() => {
        handleAutomaticStatusChange();
        updateTimers();
      }, 1000); // Update every second
      setIntervalId(id);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [queuedVans]);

  const handleQueue = async (van_id: number) => {
    const now = new Date().toISOString();
    await fetch('./api/van', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ van_id, action: 'queue', queued_at: now }),
    });
    fetchAndUpdateVans();
  };

  const handleStatusChange = async (van_id: number, newStatus: 'waiting' | 'departed' | 'arrived') => {
    const van = vans.find(v => v.van_id === van_id);
  
    if (van?.status === newStatus) {
      console.log(`Van ${van_id} is already in status ${newStatus}`);
      return; // Exit early if no status change is needed
    }
  
    console.log(`Sending status change request: van_id=${van_id}, action=${newStatus}`);
  
    const response = await fetch('./api/van', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        van_id,
        action: newStatus,
      }),
    });
  
    if (!response.ok) {
      console.error('Error changing van status:', await response.text());
    }
  
    fetchAndUpdateVans();
  };

  const handleAutomaticStatusChange = async () => {
    const firstQueuedVan = queuedVans[0];
    if (firstQueuedVan) {
      const queuedAt = firstQueuedVan.queued_at;
      if (queuedAt && new Date().getTime() - new Date(queuedAt).getTime() > 60000) { // 1 minute = 60000 ms
        if (firstQueuedVan.status === 'queued') {
          await handleStatusChange(firstQueuedVan.van_id, 'waiting');
        } else if (firstQueuedVan.status === 'waiting') {
          await handleStatusChange(firstQueuedVan.van_id, 'departed');
        } else if (firstQueuedVan.status === 'departed') {
          await handleStatusChange(firstQueuedVan.van_id, 'arrived');
        }
      }
    }
  };

  const updateTimers = () => {
    setQueuedVans((prevVans) =>
      prevVans.map((van) => ({
        ...van,
        queued_at: van.queued_at, // Update to recalculate timer based on queued_at
      }))
    );
  };

  const fetchAndUpdateVans = async () => {
    const updatedVans = await (await fetch('./api/van')).json();
    setQueuedVans(updatedVans.filter((van: Van) => van.status === 'queued'));
    setVans(updatedVans.filter((van: Van) => van.status === 'idle'));
  };

  const getRemainingTime = (queuedAt: string) => {
    const queuedDate = new Date(queuedAt);
    const now = new Date();
    const diff = (now.getTime() - queuedDate.getTime()) / 1000; // in seconds
    const minutes = Math.floor(diff / 60);
    const seconds = Math.floor(diff % 60);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div>
      <h1>Idle Vans</h1>
      <ul>
        {vans.map((van) => (
          <li key={van.van_id}>
            Van ID: {van.van_id}
            <button onClick={() => handleQueue(van.van_id)}>Queue</button>
          </li>
        ))}
      </ul>
      <h1>Queued Vans</h1>
      <ul>
        {queuedVans.map((van) => (
          <li key={van.van_id}>
            Van ID: {van.van_id}
            {van.queued_at && <span>Queued for: {getRemainingTime(van.queued_at)}</span>}
            {van.status === 'queued' && (
              <button onClick={() => handleStatusChange(van.van_id, 'waiting')}>Waiting</button>
            )}
            {van.status === 'waiting' && (
              <button onClick={() => handleStatusChange(van.van_id, 'departed')}>Departed</button>
            )}
            {van.status === 'departed' && (
              <button onClick={() => handleStatusChange(van.van_id, 'arrived')}>Arrived</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
