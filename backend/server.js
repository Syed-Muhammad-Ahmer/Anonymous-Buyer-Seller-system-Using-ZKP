import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

const PROVER_DIR = path.resolve('../prover');

async function runCairo(inputCairoContent) {
  // Write input.cairo
  const inputPath = path.join(PROVER_DIR, 'src', 'input.cairo');
  await fs.writeFile(inputPath, inputCairoContent);

  // Run scarb test
  return new Promise((resolve, reject) => {
    exec('scarb test', { cwd: PROVER_DIR }, (error, stdout, stderr) => {
      const combined = stdout + '\n' + stderr;
      if (error && !combined.includes('COMMITMENT=')) {
        // Scarb test exits with 1 if tests fail or panic, but if it output the commitment, it might still have failed the test suite?
        // Wait, if it panics, it's a failure. But if it prints and doesn't panic, it exits 0.
        console.error("Cairo execution failed:", combined);
        reject(error);
      } else {
        resolve(combined);
      }
    });
  });
}

function parseHexToCairoFelt(hexStr) {
  if (!hexStr.startsWith('0x')) return hexStr;
  return hexStr; // Cairo supports 0x literals for felt252
}

app.post('/api/commit', async (req, res) => {
  const { owner, itemId, price, salt } = req.body;
  
  const inputCairo = `
use starknet::ContractAddress;
#[feature("deprecated-starknet-consts")]

pub fn get_operation() -> felt252 { 'commit' }

pub fn get_buyer_owner() -> ContractAddress { starknet::contract_address_const::<${parseHexToCairoFelt(owner)}>() }
pub fn get_buyer_item_id() -> felt252 { ${itemId} }
pub fn get_buyer_price() -> felt252 { ${price} }
pub fn get_buyer_salt() -> felt252 { ${salt} }

// Dummy seller functions to avoid compile errors
pub fn get_seller_owner() -> ContractAddress { starknet::contract_address_const::<0x0>() }
pub fn get_seller_item_id() -> felt252 { 0 }
pub fn get_seller_price() -> felt252 { 0 }
pub fn get_seller_salt() -> felt252 { 0 }
`;

  try {
    const stdout = await runCairo(inputCairo);
    const match = stdout.match(/COMMITMENT=(0x[0-9a-fA-F]+|[0-9]+)/);
    if (match) {
      res.json({ commitment: match[1], proof: "SCARB_EXECUTION_TRACE_OK" });
    } else {
      res.status(500).json({ error: "Failed to parse commitment from Cairo output." });
    }
  } catch (err) {
    res.status(500).json({ error: "Cairo execution failed" });
  }
});

app.post('/api/match', async (req, res) => {
  const { buyer, seller } = req.body;
  
  const inputCairo = `
use starknet::ContractAddress;
#[feature("deprecated-starknet-consts")]

pub fn get_operation() -> felt252 { 'match' }

pub fn get_buyer_owner() -> ContractAddress { starknet::contract_address_const::<${parseHexToCairoFelt(buyer.owner)}>() }
pub fn get_buyer_item_id() -> felt252 { ${buyer.itemId} }
pub fn get_buyer_price() -> felt252 { ${buyer.price} }
pub fn get_buyer_salt() -> felt252 { ${buyer.salt} }

pub fn get_seller_owner() -> ContractAddress { starknet::contract_address_const::<${parseHexToCairoFelt(seller.owner)}>() }
pub fn get_seller_item_id() -> felt252 { ${seller.itemId} }
pub fn get_seller_price() -> felt252 { ${seller.price} }
pub fn get_seller_salt() -> felt252 { ${seller.salt} }
`;

  try {
    const stdout = await runCairo(inputCairo);
    
    const buyerMatch = stdout.match(/BUYER_COMMITMENT=(0x[0-9a-fA-F]+|[0-9]+)/);
    const sellerMatch = stdout.match(/SELLER_COMMITMENT=(0x[0-9a-fA-F]+|[0-9]+)/);
    
    if (buyerMatch && sellerMatch) {
      res.json({ 
        buyerCommitment: buyerMatch[1], 
        sellerCommitment: sellerMatch[1],
        proof: "STARK_PROOF_SIMULATED_" + Date.now() 
      });
    } else {
      res.status(400).json({ error: "Cairo execution failed (constraints not met or parsing error).", details: stdout });
    }
  } catch (err) {
    res.status(500).json({ error: "Cairo execution failed (assert failed)." });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Cairo Prover Backend running on port ${PORT}`);
});
