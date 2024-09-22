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
  const [mixerPrice, setMixerPrice] = useState('');
  const [mixerTonPrice, setMixerTonPrice] = useState('');
  const [apr, setApr] = useState('');
  const walletAddress = useTonAddress();
  const [showPopup, setShowPopup] = useState(false);  
  const [penalty, setPenalty] = useState(0);


  const STAKING_ADDRESS = Address.parse("EQCy3fjAM0ABtYWJ6OSqlSmLDZ9TuS2BwJg-gQLOloksvW2C");
  const MIXER_ADDRESS = Address.parse("EQAdFbynSUlzIlh_I4fXuYaer3rvY0TG0BK-NQZ-Y871pZoM");

  const getClient = async () => {
    const endpoint = await getHttpEndpoint();
    return new TonClient({ endpoint });
  };


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

  
      setUnclaimedEarnings(data.data.rewards/Math.pow(10,9));
      setStakedBalance(data.data.stake/Math.pow(10,9));
      setmixerbalance(data.data.mixerBalance);
      setMixerPrice(data.data.mixerPrice);
      setMixerTonPrice(data.data.mixerTonPrice);
      setApr(data.data.apr);
      setPenalty(data.data.penalty);
      console.log(mixerbalance);
    } catch (error) {
      console.error('Failed to fetch staking data:', error);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchStakingData(); 
      const intervalId = setInterval(fetchStakingData, 20000); 
      return () => clearInterval(intervalId); 
    } else {
      setDepositAmount('');
      setLastFetchedStakedBalance(0);
      setLastFetchedUnclaimedEarnings(0);
      setStakedBalance(0);
      setmixerbalance('');
      setPenalty(0);
      setWithdrawalAmount('');
      setUnclaimedEarnings(0);
    }
  }, [walletAddress]); 

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
          .storeCoins(50000000)
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
        setShowPopup(false);
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
        setShowPopup(false);
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
        setShowPopup(false);
      }
    }
  };

  useEffect(() => {
    if (
      showPopup && 
      (stakedBalance !== lastFetchedStakedBalance || unclaimedEarnings !== lastFetchedUnclaimedEarnings)
    ) {
      setShowPopup(false);  
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
      <h1 style={{ fontFamily: 'Roboto, sans-serif', fontWeight: '500' }}>
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
      Stake $MIXER
    </h1>


        <div className="staked-info">
          <div className="info-box">
            <h3>Staked Balance</h3>
            <p>{(isNaN(stakedBalance) ? 0 : stakedBalance).toLocaleString()} MIXER</p>
          </div>
          <div className="info-box">
            <h3>Unclaimed Rewards</h3>
            <p>{(isNaN(unclaimedEarnings) ? 0 : unclaimedEarnings).toLocaleString('en-US', {maximumFractionDigits: 4, maximumSignificantDigits: 5})} TON</p>
          </div>
          <div className="info-box">
            <h3>Annual APR %</h3>
            <p>{apr}%</p>
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
     
      <span 
        className="balance-label" 
        onClick={() => setDepositAmount(mixerbalance.toString())}
        style={{ cursor: 'pointer' }}
      >
        Your Mixer balance: {(mixerbalance ?? 0).toLocaleString()} MIXER
      </span>
    </div>

    <input
      type="number"
      value={depositAmount}
      placeholder="Enter Amount To Deposit"
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
        Your Staked balance: {(stakedBalance ?? 0).toLocaleString()} MIXER
      </span>
    </div>
            <input
              type="number"
              value={withdrawalAmount}
              placeholder="Enter Amount To Widraw"
              onChange={(e) => setWithdrawalAmount(e.target.value)}
            />
            {penalty >= 999999 && (
            <p style={{ color: 'red', fontWeight: '150' }}>
  Warning: If you withdraw all, you will suffer from a penalty of {(penalty / Math.pow(10, 9)).toFixed(3)} MIXER.
</p>)}
      
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
