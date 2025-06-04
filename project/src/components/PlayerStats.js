import React from "react";
import { Chart } from "chart.js/auto";

function PlayerStats() {
  React.useEffect(() => {
    const ctx = document.getElementById("statsChart").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Player A", "Player B", "Player C"],
        datasets: [
          {
            label: "Games Won",
            data: [5, 3, 7],
            backgroundColor: ["red", "blue", "green"],
          },
        ],
      },
    });
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Player Statistics</h1>
      <canvas id="statsChart" width="400" height="200"></canvas>
    </div>
  );
}

export default PlayerStats;