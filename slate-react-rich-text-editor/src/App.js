import React from 'react';
import './App.css';
import TextEditor from './components/TextEditor';

function App() {

  const editor = TextEditor;

  return (
    <div className="App">
      <h1>Editor</h1>
      {editor()}
    </div>
  );
}

export default App;
