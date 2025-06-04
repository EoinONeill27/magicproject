import React, { useState } from "react";

function GameLogger() {
  const [log, setLog] = useState([]);

  const handleAddLog = () => {
    const action = prompt("Enter an action (e.g., Player A dealt 3 damage)");
    if (action) setLog([...log, action]);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Game Logger</h1>
      <button onClick={handleAddLog} style={{ padding: "10px" }}>Log Action</button>
      <button style={{ padding: "10px", marginLeft: "10px" }}>End Game</button>
      <h2>Game Log</h2>
      <ul>
        {log.map((entry, index) => (
          <li key={index}>{entry}</li>
        ))}
      </ul>
    </div>
  );
}

export default GameLogger;