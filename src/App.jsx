import { useState, useEffect } from 'react';
import { useTonAddress, useTonConnectUI,TonConnectButton } from '@tonconnect/ui-react';
import reactLogo from './assets/react.svg';
import tonLogo from './assets/ton.svg';
import './App.css';

const generateUniqueNumber = (boc) => {
  let hash = 0;
  for (let i = 0; i < boc.length; i++) {
    const char = boc.charCodeAt(i);
    hash = (hash << 5) - hash + char;
  }
  return Math.abs(hash) % 1000000; // Ensure the number is positive and within a certain range
};

function App() {
  const [tonConnectUI] = useTonConnectUI();
  const [boc, setBoc] = useState('');
  const [raffleNumber, setRaffleNumber] = useState(null);
  const [poolPrize, setPoolPrize] = useState(0);
  const userFriendlyAddress = useTonAddress();

  useEffect(() => {
    if (userFriendlyAddress) {
      const savedRaffleNumber = localStorage.getItem(`raffleNumber_${userFriendlyAddress}`);
      if (savedRaffleNumber) {
        setRaffleNumber(Number(savedRaffleNumber));
      }
    }

    // Fetch pool prize amount from localStorage
    const savedPoolPrize = localStorage.getItem('poolPrize');
    if (savedPoolPrize) {
      setPoolPrize(Number(savedPoolPrize));
    }
  }, [userFriendlyAddress]);

  const handleClick = async () => {
    try {
      const result = await tonConnectUI.sendTransaction({
        messages: [
          {
            address: "UQA-xcMp-sE08nICCBQIVjj6wGsDEgj25NdJGfdnE-8nqTrG",
            amount: "1000000"
          }
        ]
      });

      setBoc(result.boc);

      const uniqueNumber = generateUniqueNumber(result.boc); // Generate a unique number from BOC
      setRaffleNumber(uniqueNumber); // Set the raffle ticket number

      if (userFriendlyAddress) {
        localStorage.setItem(`raffleNumber_${userFriendlyAddress}`, uniqueNumber);
      }

      // Increment pool prize
      const updatedPoolPrize = poolPrize + 1;
      setPoolPrize(updatedPoolPrize);
      localStorage.setItem('poolPrize', updatedPoolPrize);

      alert('Transaction was sent successfully.');
    } catch (e) {
      console.error('Transaction failed:', e);
      alert('Transaction failed. Check console for details.');
    }
  };

  return (
    <div className="App">
      <div className="top-right-button">
        <TonConnectButton />
      </div>

      <div className="ton-logo-container">
        <img src={tonLogo} className="ton-logo" alt="TON logo" />
        <h2>The TON Raffle</h2>
      </div>

      <div>
        <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      {raffleNumber ? (
        <div className="raffle-number-container">
          <h2>Here is your raffle ticket number:</h2>
          <p className="raffle-number">{raffleNumber}</p>
        </div>
      ) : (
        <button className="buy-raffle-button" onClick={handleClick}>
          Buy a raffle
        </button>
      )}

      <div className="pool-prize-container">
        <h2>Current Pool Prize:</h2>
        <p className="pool-prize">{poolPrize} TON</p>
      </div>
    </div>
  );
}

export default App;
