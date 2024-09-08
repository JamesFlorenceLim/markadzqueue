"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';

// Define the Van interface
interface Van {
  id: number;
  van_plate: string;
  operator_name: string;
  status?: string;
}

const VansPage = () => {
  const [idleVans, setIdleVans] = useState<Van[]>([]);
  const [queuedVans, setQueuedVans] = useState<Van[]>([]);

  useEffect(() => {
    // Fetch idle and queued vans on component load
    fetchVans();
  }, []);

  const fetchVans = async () => {
    try {
      const idleResponse = await axios.get<Van[]>('/api/vans/idle');
      const queuedResponse = await axios.get<Van[]>('/api/vans/queued');
      setIdleVans(idleResponse.data);
      setQueuedVans(queuedResponse.data);
    } catch (error) {
      console.error("Error fetching vans:", error);
    }
  };

  const queueVan = async (id: number) => {
    try {
      await axios.post('/api/vans/update-status', { id, status: 'queued' });
      fetchVans();  // Refresh lists
    } catch (error) {
      console.error("Error updating van status:", error);
    }
  };

  const updateVanStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'queued' ? 'waiting' :
                      currentStatus === 'waiting' ? 'departed' : 
                      currentStatus === 'departed' ? 'arrived' : 'idle';

    try {
      await axios.post('/api/vans/update-status', { id, status: nextStatus });
      fetchVans();
    } catch (error) {
      console.error("Error updating van status:", error);
    }
  };

  return (
    <div className="van-queue-system">
      {/* Idle Vans Section */}
      <div className="idle-vans">
        <h2>Idle Vans</h2>
        <ul>
          {idleVans.map(van => (
            <li key={van.id}>
              {van.van_plate} - {van.operator_name} - {van.status}
              {/* Add a button to queue the van */}
              <button 
                className="ml-2 p-1 bg-blue-500 text-white rounded"
                onClick={() => queueVan(van.id)}
              >
                Queue Van
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Queued Vans Section */}
      <div className="queued-vans">
        <h2>Queued Vans</h2>
        <ul>
          {queuedVans.map(van => (
            <li key={van.id}>
              {van.van_plate} - {van.operator_name} - {van.status}
              {/* Add a button to update van status */}
              <button 
                className="ml-2 p-1 bg-green-500 text-white rounded"
                onClick={() => updateVanStatus(van.id, van.status ?? '')}
              >
                Update Status
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default VansPage;
