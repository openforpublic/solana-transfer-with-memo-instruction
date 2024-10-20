import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export async function POST(request) {
  const { publicKey } = await request.json();

  const connection = new Connection(`https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`);

  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(new PublicKey(publicKey), {
      programId: TOKEN_PROGRAM_ID,
    });

    const tokenMints = tokenAccounts.value.map(accountInfo => accountInfo.account.data.parsed.info.mint);

    // Fetch token metadata using Helius API getAssetBatch
    const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: `gettoken-${Date.now()}`,
        method: 'getAssetBatch',
        params: {
          ids: tokenMints
        },
      }),
    });
    const { result } = await response.json();

    const userSPLToken = result
      .filter(asset => asset.token_info && asset.token_info.decimals > 5)
      .map(asset => ({
        mint: asset.id,
        balance: tokenAccounts.value.find(account => account.account.data.parsed.info.mint === asset.id).account.data.parsed.info.tokenAmount.uiAmount,
        decimals: asset.token_info.decimals,
        symbol: asset.token_info.symbol || 'Unknown'
      }));

    // Add SOL to the list
    const solBalance = await connection.getBalance(new PublicKey(publicKey));
    userSPLToken.unshift({
      mint: 'SOL',
      balance: solBalance / 1e9,
      decimals: 9,
      symbol: 'SOL'
    });

    return NextResponse.json(userSPLToken);
  } catch (error) {
    console.error('Error fetching token accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch token accounts' }, { status: 500 });
  }
}
