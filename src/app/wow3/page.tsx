"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';

const fetchAssignments = async () => {
  const response = await axios.get('/api/assignments?terminal=terminal2');
  return response.data;
};

const updateAssignment = async (id: number, status: string) => {
  await axios.put('/api/assignments', { id, status, terminal: 'terminal2' });
};

const Terminal2 = () => {
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    const loadAssignments = async () => {
      const data = await fetchAssignments();
      setAssignments(data);
    };

    loadAssignments();
    const intervalId = setInterval(() => loadAssignments(), 5000); // Polling every 5 seconds

    return () => clearInterval(intervalId);
  }, []);

  const handleStatusChange = async (id: number, newStatus: string) => {
    await updateAssignment(id, newStatus);
  };

  return (
    <div>
      <h1>Terminal 2</h1>
      <ul>
        {assignments.map((assignment: any) => (
          <li key={assignment.id}>
            Van ID: {assignment.van_id} - Status: {assignment.status}
            <button onClick={() => handleStatusChange(assignment.id, 'queued')}>Queue</button>
            <button onClick={() => handleStatusChange(assignment.id, 'waiting')}>Wait</button>
            <button onClick={() => handleStatusChange(assignment.id, 'departed')}>Depart</button>
            <button onClick={() => handleStatusChange(assignment.id, 'arrived')}>Arrive</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Terminal2;
