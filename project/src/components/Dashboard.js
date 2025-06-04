import React, { useState } from "react";

function Dashboard() {
  const [players, setPlayers] = useState([
    { name: "Player A", health: 20, damageDealt: 0 },
    { name: "Player B", health: 20, damageDealt: 0 },
    { name: "Player C", health: 20, damageDealt: 0 },
  ]);

  const [log, setLog] = useState([]);

  // Handle damage dealt to a player
  const handleDamage = (index, amount) => {
    const updatedPlayers = [...players];
    updatedPlayers[index].health -= amount;
    updatedPlayers.forEach((player, idx) => {
      if (idx !== index) player.damageDealt += amount;
    });
    setPlayers(updatedPlayers);

    setLog([
      ...log,
      `Player ${players[index].name} took ${amount} damage.`,
    ]);
  };

  // Heal a player
  const handleHeal = (index, amount) => {
    const updatedPlayers = [...players];
    updatedPlayers[index].health += amount;
    setPlayers(updatedPlayers);

    setLog([
      ...log,
      `Player ${players[index].name} healed ${amount} health.`,
    ]);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Magic: The Gathering Tracker</h1>
      <h2>Game in Progress</h2>
      <div style={{ display: "flex", gap: "20px" }}>
        {players.map((player, index) => (
          <div key={index} style={{ border: "1px solid #ccc", padding: "10px" }}>
            <h3>{player.name}</h3>
            <p>Health: {player.health}</p>
            <p>Damage Dealt: {player.damageDealt}</p>
            <button
              onClick={() => handleDamage(index, 1)}
              style={{ marginRight: "5px" }}
            >
              Deal 1 Damage
            </button>
            <button onClick={() => handleHeal(index, 1)}>Heal 1 Health</button>
          </div>
        ))}
      </div>
      <h2>Game Log</h2>
      <ul>
        {log.map((entry, index) => (
          <li key={index}>{entry}</li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;
