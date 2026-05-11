use starknet::ContractAddress;

#[starknet::interface]
pub trait IAnonymousRegistry<TContractState> {
    fn register_order(ref self: TContractState, commitment: felt252);
    fn settle_match(
        ref self: TContractState, 
        buyer_commitment: felt252, 
        seller_commitment: felt252
    );
    fn is_nullified(self: @TContractState, commitment: felt252) -> bool;
}

#[starknet::contract]
pub mod AnonymousRegistry {
    use super::IAnonymousRegistry;
    use starknet::{ContractAddress, get_caller_address};
    use core::starknet::event::EventEmitter;

    #[storage]
    struct Storage {
        // Tracks registered public commitments (Poseidon hashes)
        registered_commitments: LegacyMap::<felt252, bool>,
        // Nullifier tree to prevent double matching / replay attacks
        nullifier_tree: LegacyMap::<felt252, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        OrderRegistered: OrderRegistered,
        MatchSettled: MatchSettled,
    }

    #[derive(Drop, starknet::Event)]
    struct OrderRegistered {
        #[key]
        commitment: felt252,
        owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct MatchSettled {
        #[key]
        buyer_commitment: felt252,
        #[key]
        seller_commitment: felt252,
    }

    #[abi(embed_v0)]
    impl AnonymousRegistryImpl of IAnonymousRegistry<ContractState> {
        
        /// Step 1: Users submit their hashed commitments anonymously.
        fn register_order(ref self: ContractState, commitment: felt252) {
            let caller = get_caller_address();
            self.registered_commitments.write(commitment, true);
            
            self.emit(OrderRegistered { commitment, owner: caller });
        }

        /// Step 2: The Relayer submits the matched commitments.
        /// (In a full production ZK-STARK setup, a proof `_proof: Span<felt252>` 
        /// would be passed and verified here using a verifier contract).
        fn settle_match(
            ref self: ContractState, 
            buyer_commitment: felt252, 
            seller_commitment: felt252
        ) {
            // Verify both commitments exist on-chain
            assert(self.registered_commitments.read(buyer_commitment), 'Buyer order not found');
            assert(self.registered_commitments.read(seller_commitment), 'Seller order not found');

            // Prevent double-spending via Nullifiers
            assert(!self.nullifier_tree.read(buyer_commitment), 'Buyer already matched');
            assert(!self.nullifier_tree.read(seller_commitment), 'Seller already matched');

            // --- ZK PROOF VERIFICATION HAPPENS HERE ---
            // In Phase 3, we simulate the off-chain STARK verification passing.
            // If the proof is valid, it guarantees buyer_price >= seller_price.

            // Nullify both commitments so they cannot be used again
            self.nullifier_tree.write(buyer_commitment, true);
            self.nullifier_tree.write(seller_commitment, true);

            // Execute escrow token transfer logic here...

            self.emit(MatchSettled { buyer_commitment, seller_commitment });
        }

        /// Check if an order has been spent (nullified)
        fn is_nullified(self: @ContractState, commitment: felt252) -> bool {
            self.nullifier_tree.read(commitment)
        }
    }
}