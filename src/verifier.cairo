#[starknet::interface]
pub trait IVerifier<TContractState> {
    fn verify_proof(self: @TContractState, proof: Span<felt252>, public_inputs: Span<felt252>) -> bool;
}

#[starknet::contract]
pub mod DummyVerifier {
    use super::IVerifier;

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl VerifierImpl of IVerifier<ContractState> {
        fn verify_proof(self: @ContractState, proof: Span<felt252>, public_inputs: Span<felt252>) -> bool {
            // Dummy implementation: in a real marketplace this would verify a STARK/SNARK proof.
            // For now, we assume if the proof has at least 1 element and matches a dummy condition, it's valid.
            if proof.len() > 0 {
                return true;
            }
            false
        }
    }
}
