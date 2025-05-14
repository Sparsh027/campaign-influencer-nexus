
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Ensure a root element exists
const rootElement = document.getElementById("root");
if (!rootElement) {
  const newRoot = document.createElement("div");
  newRoot.id = "root";
  document.body.appendChild(newRoot);
}

createRoot(document.getElementById("root")!).render(<App />);
