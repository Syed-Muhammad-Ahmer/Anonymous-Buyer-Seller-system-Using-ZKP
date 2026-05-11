use starknet::ContractAddress;

// The private data structure for an order.
// In a true ZK context, these values are kept off-chain, 
// and only their Poseidon Hash (Commitment) is public.
#[derive(Drop, Copy, Serde)]
pub struct Order {
    pub owner: ContractAddress,
    pub item_id: felt252,
    pub price: u64,
    pub salt: felt252, // Random nonce for cryptographic anonymity (hiding)
}