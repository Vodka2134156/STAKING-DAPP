import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
function DetailsPage() {
  const { number } = useParams(); // Get the unique number from the URL

  return (
    <div>
      <h1>Details Page</h1>
      <p>Unique Number: {number}</p>
      {/* You can add more details or functionality here */}
    </div>
  );
} // Import the DetailsPage component
import './index.css';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

// This manifest is used temporarily for development purposes
const manifestUrl = 
  "https://raw.githubusercontent.com/ton-community/tutorials/main/03-client/test/public/tonconnect-manifest.json";

// Render the App component wrapped with TonConnectUIProvider and Router
ReactDOM.createRoot(document.getElementById('root')).render(
  <TonConnectUIProvider manifestUrl={manifestUrl}>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/details/:number" element={<DetailsPage />} />
      </Routes>
    </Router>
  </TonConnectUIProvider>
);
