import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import GameLogger from "./components/GameLogger";
import PlayerStats from "./components/PlayerStats";
import GameHistory from "./components/GameHistory";
import Settings from "./components/Settings";

function App() {
  return (
    <Router>
      <div>
        <nav style={{ padding: "10px", background: "#333", color: "#fff" }}>
          <Link to="/" style={{ margin: "10px", color: "#fff" }}>Dashboard</Link>
          <Link to="/log-game" style={{ margin: "10px", color: "#fff" }}>Log Game</Link>
          <Link to="/stats" style={{ margin: "10px", color: "#fff" }}>Player Stats</Link>
          <Link to="/history" style={{ margin: "10px", color: "#fff" }}>Game History</Link>
          <Link to="/settings" style={{ margin: "10px", color: "#fff" }}>Settings</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/log-game" element={<GameLogger />} />
          <Route path="/stats" element={<PlayerStats />} />
          <Route path="/history" element={<GameHistory />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;