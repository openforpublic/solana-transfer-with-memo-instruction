import { NextResponse } from 'next/server';
import { Connection, PublicKey, Transaction, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export async function POST(request) {
  const { fromPubkey, toPubkey, amount, memo, selectedToken, tokenDecimals } = await request.json();

  const connection = new Connection(`https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`);

  try {
    let transaction = new Transaction();

    if (selectedToken === 'SOL') {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(fromPubkey),
          toPubkey: new PublicKey(toPubkey),
          lamports: amount * 1e9, // Convert SOL to lamports
        })
      );
    } else {
      const tokenMint = new PublicKey(selectedToken);
      const sourceAccount = (await connection.getTokenAccountsByOwner(new PublicKey(fromPubkey), { mint: tokenMint })).value[0].pubkey;
      const destinationAccount = await Token.getAssociatedTokenAddress(
        TOKEN_PROGRAM_ID,
        tokenMint,
        new PublicKey(toPubkey)
      );

      transaction.add(
        Token.createTransferInstruction(
          TOKEN_PROGRAM_ID,
          sourceAccount,
          destinationAccount,
          new PublicKey(fromPubkey),
          [],
          amount * Math.pow(10, tokenDecimals)
        )
      );
    }

    // Add memo instruction
    transaction.add(
      new TransactionInstruction({
        keys: [{ pubkey: new PublicKey(fromPubkey), isSigner: true, isWritable: true }],
        data: Buffer.from(memo, 'utf-8'),
        programId: MEMO_PROGRAM_ID,
      })
    );

    // Set the fee payer
    transaction.feePayer = new PublicKey(fromPubkey);

    // Get the latest blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    return NextResponse.json({ transaction: transaction.serialize({ requireAllSignatures: false }) });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}

export const runtime = 'edge';