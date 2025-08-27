import React from 'react';
import './App.css';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>Electric Arc Furnace Simulator</h1>
          <p>Real-time monitoring and control system for EAF operations</p>
        </header>
        <main className="main-content">
          <Dashboard />
        </main>
      </div>
    </div>
  );
}

export default App;
