import { NextResponse } from 'next/server';
import { Connection, Transaction } from '@solana/web3.js';

export async function POST(request) {
  const { signedTransaction } = await request.json();

  const connection = new Connection(`https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`);

  try {
    const transaction = Transaction.from(Buffer.from(signedTransaction));
    const signature = await connection.sendRawTransaction(transaction.serialize());

    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature,
      ...latestBlockhash
    });

    return NextResponse.json({ signature });
  } catch (error) {
    console.error('Error sending transaction:', error);
    return NextResponse.json({ error: 'Failed to send transaction' }, { status: 500 });
  }
}

export const runtime = 'edge';