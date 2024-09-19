import React, { useState, useEffect } from 'react';
import { TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { Address, TonClient, TupleBuilder, beginCell, toNano } from '@ton/ton';
import { getHttpEndpoint } from '@orbs-network/ton-access';

import mixerLogo from './assets/mixer.svg';
import './App.css';

function App() {
  const [tonConnectUI] = useTonConnectUI();
  const [stakedBalance, setStakedBalance] = useState(0);
  const [unclaimedEarnings, setUnclaimedEarnings] = useState(0);
  const [depositAmount, setDepositAmount] = useState('');
  const [lastFetchedStakedBalance, setLastFetchedStakedBalance] = useState(stakedBalance);
  const [lastFetchedUnclaimedEarnings, setLastFetchedUnclaimedEarnings] = useState(unclaimedEarnings);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [mixerbalance, setmixerbalance] = useState('');
  const walletAddress = useTonAddress();
  const [showPopup, setShowPopup] = useState(false);  


  const STAKING_ADDRESS = Address.parse("EQAJX1AKb3aKd1BmGGNfi-nbONo8cvSN4aUCRHLB6HFKyHns");
  const MIXER_ADDRESS = Address.parse("EQAdFbynSUlzIlh_I4fXuYaer3rvY0TG0BK-NQZ-Y871pZoM");

  const getClient = async () => {
    const endpoint = await getHttpEndpoint();
    return new TonClient({ endpoint });
  };

  // Function to fetch staked balance and unclaimed earnings
  const fetchStakingData = async () => {
    try {
      const apiUrl = '/api/estimate';
      const requestBody = { address: walletAddress };  

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log(data)

      // Assuming the API returns `rewards` and `stake` in the response
      setUnclaimedEarnings(data.data.rewards);
      setStakedBalance(data.data.stake/Math.pow(10,9));
      setmixerbalance(data.data.mixerBalance)
      console.log(mixerbalance)
    } catch (error) {
      console.error('Failed to fetch staking data:', error);
    }
  };

  // Poll the staking data every 20 seconds
  useEffect(() => {
    if (walletAddress) {
      fetchStakingData(); // Fetch initially
      const intervalId = setInterval(fetchStakingData, 20000); // Fetch every 20 seconds

      return () => clearInterval(intervalId); // Cleanup on component unmount
    }
  }, [walletAddress]); // Only start polling if the wallet address is available

  const handleDeposit = async () => {
    if (depositAmount > 0) {
      try {
        const amount = parseFloat(depositAmount);

        const client = await getClient();

        const builder = new TupleBuilder();
        builder.writeAddress(Address.parse(walletAddress));
        const args = builder.build();

        const response = await client.runMethod(
          MIXER_ADDRESS,
          "get_wallet_address",
          args
        );

        const jettonWallet = response.stack.readAddressOpt();

        const forwardPayload = beginCell()
          .storeUint(0, 32)
          .storeStringTail('STAKE $MIXER')
          .endCell();

        const body = beginCell()
          .storeUint(0xf8a7ea5, 32)
          .storeUint(0, 64)
          .storeCoins(toNano(amount))
          .storeAddress(STAKING_ADDRESS)
          .storeAddress(STAKING_ADDRESS)
          .storeBit(0)
          .storeCoins(10000000)
          .storeBit(1)
          .storeRef(forwardPayload)
          .endCell();

        const transaction = {
          validUntil: Math.floor(Date.now() / 1000) + 360,
          messages: [
            {
              address: jettonWallet.toString(),
              amount: toNano(0.123).toString(),
              payload: body.toBoc().toString('base64'),
            }
          ]
        };
        setLastFetchedStakedBalance(stakedBalance);
        setLastFetchedUnclaimedEarnings(unclaimedEarnings);
        setShowPopup(true);
        await tonConnectUI.sendTransaction(transaction);
        
        setDepositAmount('');
        
      } catch (error) {
        console.error('Transaction failed:', error);
      }
    }
  };

  const handleWithdraw = async () => {
    if (withdrawalAmount > 0 && withdrawalAmount <= stakedBalance) {
      try {
        const amount = parseFloat(withdrawalAmount);

        const msg_body = beginCell()
          .storeUint(4, 32)
          .storeCoins(toNano(amount))
          .endCell();

        const transaction = {
          validUntil: Math.floor(Date.now() / 1000) + 360,
          messages: [
            {
              address: STAKING_ADDRESS.toString(),
              amount: toNano(0.123).toString(),
              payload: msg_body.toBoc().toString('base64'),
            }
          ]
        };
        setLastFetchedStakedBalance(stakedBalance);
        setLastFetchedUnclaimedEarnings(unclaimedEarnings);
        setShowPopup(true);
        await tonConnectUI.sendTransaction(transaction);
        
        setWithdrawalAmount('');

      } catch (error) {
        console.error('Transaction failed:', error);
      }
    }
  };

  const handleClaimRewards = async () => {
    if (unclaimedEarnings > 0) {
      try {
        const msg_body = beginCell()
          .storeUint(5, 32)
          .endCell();

        const transaction = {
          validUntil: Math.floor(Date.now() / 1000) + 360,
          messages: [
            {
              address: STAKING_ADDRESS.toString(),
              amount: toNano(0.123).toString(),
              payload: msg_body.toBoc().toString('base64'),
            }
          ]
        };
        setLastFetchedStakedBalance(stakedBalance);
        setLastFetchedUnclaimedEarnings(unclaimedEarnings);
        setShowPopup(true);
        await tonConnectUI.sendTransaction(transaction);
        
      } catch (error) {
        console.error('Transaction failed:', error);
      }
    }
  };
  useEffect(() => {
    if (
      showPopup && 
      (stakedBalance !== lastFetchedStakedBalance || unclaimedEarnings !== lastFetchedUnclaimedEarnings)
    ) {
      setShowPopup(false);  // Hide the popup if balances change compared to last fetched values
    }
  }, [stakedBalance, unclaimedEarnings, showPopup, lastFetchedStakedBalance, lastFetchedUnclaimedEarnings]);

  return (
    <div className="app-container">
      <header>
        <div className="connect-btn">
          <TonConnectButton />
        </div>
      </header>

      <div className="staking-card">
          <h1>
      <img
        src={mixerLogo}
        alt="MIXER Logo"
        style={{ 
          height: '60px', 
          width: '60px', 
          marginRight: '10px', 
          position: 'relative', 
          top: '10px' 
        }}
      />
      Stake MIXER
    </h1>


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

    <div className="balance-display">
      {/* Make the balance clickable to auto-fill the input */}
      <span 
        className="balance-label" 
        onClick={() => setDepositAmount(mixerbalance.toString())}
        style={{ cursor: 'pointer' }}
      >
        Your Mixer balance: {mixerbalance} MIXER
      </span>
    </div>

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
            <div className="balance-display">
      
      <span 
        className="balance-label" 
        onClick={() => setWithdrawalAmount(stakedBalance.toString())}
        style={{ cursor: 'pointer' }}
      >
        Your Staked balance: {stakedBalance} MIXER
      </span>
    </div>
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
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="loading-spinner"></div>
            <p>Please wait for your transaction to be processed...</p>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
