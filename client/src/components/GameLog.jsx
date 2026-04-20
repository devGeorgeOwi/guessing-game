import React, { useEffect, useRef } from 'react';

export default function GameLog({ events }) {
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  return (
    <div className="bg-gray-800 rounded-xl p-4 h-48 md:h-64 overflow-y-auto font-mono text-sm">
      <h3 className="text-purple-400 font-bold mb-2">📜 Game Log</h3>
      {events.length === 0 && <p className="text-gray-500">Waiting for game events...</p>}
      {events.map((event, idx) => (
        <div key={idx} className="mb-1 text-gray-300">
          <span className="text-purple-400">[{event.time}]</span> {event.message}
        </div>
      ))}
      <div ref={logEndRef} />
    </div>
  );
}