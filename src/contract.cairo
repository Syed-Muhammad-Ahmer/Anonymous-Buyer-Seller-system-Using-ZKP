#[starknet::interface]
pub trait IAnonymousRegistry<TContractState> {
    fn register_order(ref self: TContractState, commitment: felt252, order: crate::models::Order);
    fn settle_match(
        ref self: TContractState, 
        buyer_commitment: felt252, 
        seller_commitment: felt252,
        proof: Span<felt252>,
        public_inputs: Span<felt252>
    );
    fn is_nullified(self: @TContractState, commitment: felt252) -> bool;
    
    // Escrow / Wallet functions
    fn deposit(ref self: TContractState, amount: u256);
    fn withdraw(ref self: TContractState, amount: u256);
    fn get_balance(self: @TContractState, account: starknet::ContractAddress) -> u256;
}

#[starknet::contract]
pub mod AnonymousRegistry {
    use super::IAnonymousRegistry;
    use starknet::{ContractAddress, get_caller_address};
    use starknet::storage::{Map, StoragePointerReadAccess, StoragePointerWriteAccess};
    use crate::models::{Order, OrderStatus};
    use crate::verifier::IVerifierDispatcher;
    use crate::verifier::IVerifierDispatcherTrait;

    #[storage]
    struct Storage {
        registered_commitments: Map::<felt252, bool>,
        orders: Map::<felt252, Order>,
        nullifier_tree: Map::<felt252, bool>,
        balances: Map::<ContractAddress, u256>,
        verifier_address: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        OrderRegistered: OrderRegistered,
        MatchSettled: MatchSettled,
        Deposit: Deposit,
        Withdraw: Withdraw,
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

    #[derive(Drop, starknet::Event)]
    struct Deposit {
        #[key]
        account: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct Withdraw {
        #[key]
        account: ContractAddress,
        amount: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, verifier_address: ContractAddress) {
        self.verifier_address.write(verifier_address);
    }

    #[abi(embed_v0)]
    impl AnonymousRegistryImpl of IAnonymousRegistry<ContractState> {
        fn deposit(ref self: ContractState, amount: u256) {
            let caller = get_caller_address();
            let current = self.balances.read(caller);
            self.balances.write(caller, current + amount);
            self.emit(Deposit { account: caller, amount });
        }

        fn withdraw(ref self: ContractState, amount: u256) {
            let caller = get_caller_address();
            let current = self.balances.read(caller);
            assert(current >= amount, 'Insufficient balance');
            self.balances.write(caller, current - amount);
            self.emit(Withdraw { account: caller, amount });
        }

        fn get_balance(self: @ContractState, account: ContractAddress) -> u256 {
            self.balances.read(account)
        }

        fn register_order(ref self: ContractState, commitment: felt252, order: Order) {
            let caller = get_caller_address();
            
            // Ensure owner matches caller
            assert(order.owner == caller, 'Owner must be caller');

            // If buyer, lock escrow
            if order.is_buyer {
                let price_u256: u256 = order.price.into();
                let current_balance = self.balances.read(caller);
                assert(current_balance >= price_u256, 'Insufficient balance for order');
                // Lock funds by deducting from balance
                self.balances.write(caller, current_balance - price_u256);
            }

            self.registered_commitments.write(commitment, true);
            self.orders.write(commitment, order);
            
            self.emit(OrderRegistered { commitment, owner: caller });
        }

        fn settle_match(
            ref self: ContractState, 
            buyer_commitment: felt252, 
            seller_commitment: felt252,
            proof: Span<felt252>,
            public_inputs: Span<felt252>
        ) {
            assert(self.registered_commitments.read(buyer_commitment), 'Buyer order not found');
            assert(self.registered_commitments.read(seller_commitment), 'Seller order not found');

            assert(!self.nullifier_tree.read(buyer_commitment), 'Buyer already matched');
            assert(!self.nullifier_tree.read(seller_commitment), 'Seller already matched');

            // Actual ZK Proof Verification using Verifier Contract
            let verifier_address = self.verifier_address.read();
            let verifier = IVerifierDispatcher { contract_address: verifier_address };
            let is_valid = verifier.verify_proof(proof, public_inputs);
            assert(is_valid, 'Invalid ZK Proof');

            // Mark as matched
            self.nullifier_tree.write(buyer_commitment, true);
            self.nullifier_tree.write(seller_commitment, true);

            // Escrow Transfer
            let mut buyer_order = self.orders.read(buyer_commitment);
            let mut seller_order = self.orders.read(seller_commitment);

            assert(buyer_order.is_buyer, 'Buyer commitment not a buyer');
            assert(!seller_order.is_buyer, 'Seller commitment not a seller');
            
            // Transfer locked funds to seller
            let price_u256: u256 = buyer_order.price.into();
            let seller_balance = self.balances.read(seller_order.owner);
            self.balances.write(seller_order.owner, seller_balance + price_u256);

            // Update statuses
            buyer_order.status = OrderStatus::Matched;
            seller_order.status = OrderStatus::Matched;
            self.orders.write(buyer_commitment, buyer_order);
            self.orders.write(seller_commitment, seller_order);

            self.emit(MatchSettled { buyer_commitment, seller_commitment });
        }

        fn is_nullified(self: @ContractState, commitment: felt252) -> bool {
            self.nullifier_tree.read(commitment)
        }
    }
}