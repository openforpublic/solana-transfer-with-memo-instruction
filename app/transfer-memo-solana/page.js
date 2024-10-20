'use client';

import { useState, useEffect } from 'react';

export default function TransferMemoSolana() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [connected, setConnected] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState('');

  useEffect(() => {
    if (connected) {
      fetchTokenAccounts();
    }
  }, [connected]);

  const connectWallet = async () => {
    if (typeof window.solana !== 'undefined') {
      try {
        await window.solana.connect();
        setConnected(true);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    } else {
      alert('Please install a Solana wallet like Phantom');
    }
  };

  const fetchTokenAccounts = async () => {
    const wallet = window.solana;
  
    try {
      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicKey: wallet.publicKey.toString() }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch token accounts');
      }

      const userSPLToken = await response.json();
      
      console.log(userSPLToken);
      setTokens(userSPLToken);
      setSelectedToken(userSPLToken[0].mint);
    } catch (error) {
      console.error('Error fetching token accounts:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const wallet = window.solana;

      // Prepare transaction data
      const transactionData = {
        fromPubkey: wallet.publicKey.toString(),
        toPubkey: recipient,
        amount: parseFloat(amount),
        memo: memo,
        selectedToken: selectedToken,
        tokenDecimals: tokens.find(t => t.mint === selectedToken).decimals
      };

      // Send transaction data to server
      const response = await fetch('/api/createTransaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }

      const { transaction } = await response.json();

      // Sign the transaction
      const signedTransaction = await wallet.signTransaction(transaction);

      // Send the signed transaction to the server for processing
      const sendResponse = await fetch('/api/sendTransaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ signedTransaction: signedTransaction.serialize() }),
      });

      if (!sendResponse.ok) {
        throw new Error('Failed to send transaction');
      }

      const { signature } = await sendResponse.json();
      
      alert(`Transfer successful! Signature: ${signature}`);
    } catch (error) {
      console.error('Error:', error);
      alert('Transfer failed. See console for details.');
    }
  };

  return (
    <div className="container mx-auto px-4">
      <header className="my-8">
        <h1 className="text-3xl font-bold">Transfer Assets on Solana with Memo</h1>
      </header>
      <main>
        {!connected ? (
          <section className="bg-gray-100 p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="mb-4">Please connect your Solana wallet to continue.</p>
            <button 
              onClick={connectWallet}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Connect Wallet
            </button>
          </section>
        ) : (
          <section className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Transfer Form</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <fieldset>
                <legend className="text-lg font-medium mb-2">Token Selection</legend>
                <label htmlFor="token" className="block mb-1">Select Token:</label>
                <select
                  id="token"
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  {tokens.map((token) => (
                    <option key={token.mint} value={token.mint}>
                      {token.symbol} - Balance: {token.balance}
                    </option>
                  ))}
                </select>
              </fieldset>
              
              <fieldset>
                <legend className="text-lg font-medium mb-2">Transfer Details</legend>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="recipient" className="block mb-1">Recipient Address:</label>
                    <input
                      type="text"
                      id="recipient"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      required
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label htmlFor="amount" className="block mb-1">Amount:</label>
                    <input
                      type="number"
                      id="amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label htmlFor="memo" className="block mb-1">Memo:</label>
                    <textarea
                      id="memo"
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                      rows="3"
                    />
                  </div>
                </div>
              </fieldset>

              <button 
                type="submit"
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Transfer
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
