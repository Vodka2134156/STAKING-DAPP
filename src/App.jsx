import React, { useState } from 'react';
import { TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { Address, TonClient, TupleBuilder, beginCell, toNano } from '@ton/ton';
import { getHttpEndpoint } from '@orbs-network/ton-access';
import { Buffer } from 'buffer';
window.Buffer = Buffer;
import './App.css';

function App() {
  const [tonConnectUI] = useTonConnectUI();
  const [stakedBalance, setStakedBalance] = useState(5000);
  const [unclaimedEarnings, setUnclaimedEarnings] = useState(1);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const walletAddress = useTonAddress();

  const STAKING_ADDRESS = Address.parse("EQAJX1AKb3aKd1BmGGNfi-nbONo8cvSN4aUCRHLB6HFKyHns");
  const MIXER_ADDRESS = Address.parse("EQAdFbynSUlzIlh_I4fXuYaer3rvY0TG0BK-NQZ-Y871pZoM");
  
  const getClient = async () => {
    const endpoint = await getHttpEndpoint(); 
    return new TonClient({ endpoint });
  }
  
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
          args,
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
        }

        console.log('Transaction:', transaction);
      
        await tonConnectUI.sendTransaction(transaction);
        setStakedBalance(stakedBalance + amount);
        setDepositAmount('');
        setUnclaimedEarnings(0);
      } catch (error) {
        console.error('Transaction failed:', error);
      }
    }
  };



  const handleWithdraw = async() => {
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
        }
      
        await tonConnectUI.sendTransaction(transaction);
        setStakedBalance(stakedBalance - amount);
        setWithdrawalAmount('');
        setUnclaimedEarnings(0);
      } catch (error) {
        console.error('Transaction failed:', error);
      }
    };
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
        }
      
        await tonConnectUI.sendTransaction(transaction);
        setUnclaimedEarnings(0);
      } catch (error) {
        console.error('Transaction failed:', error);
      }
    }
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
