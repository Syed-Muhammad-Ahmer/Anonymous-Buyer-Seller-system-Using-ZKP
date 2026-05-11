use core::poseidon::poseidon_hash_span;
use super::models::Order;

#[generate_trait]
pub impl AnonymousMatcher of AnonymousMatcherTrait {
    
    /// Processes the private inputs (Buyer and Seller orders),
    /// enforces the matching relation, and outputs the public commitments.
    /// If the constraints fail, the proof generation fails.
    fn verify_match_and_get_commitments(buyer: Order, seller: Order) -> (felt252, felt252) {
        
        // -------------------------------------------------------------
        // CONSTRAINT 1: The relation system (Reduces on-chain computation)
        // -------------------------------------------------------------
        // Item IDs must match perfectly
        assert(buyer.item_id == seller.item_id, 'Item ID mismatch');
        
        // Buyer's willingness to pay must be >= Seller's asking price
        assert(buyer.price >= seller.price, 'Buyer price < Seller price');

        // -------------------------------------------------------------
        // CONSTRAINT 2: Commitment Generation (Anonymity)
        // -------------------------------------------------------------
        // Compute Buyer Poseidon Hash
        let mut buyer_arr = ArrayTrait::new();
        buyer_arr.append(buyer.owner.into());
        buyer_arr.append(buyer.item_id);
        buyer_arr.append(buyer.price.into());
        buyer_arr.append(buyer.salt);
        let buyer_commitment = poseidon_hash_span(buyer_arr.span());

        // Compute Seller Poseidon Hash
        let mut seller_arr = ArrayTrait::new();
        seller_arr.append(seller.owner.into());
        seller_arr.append(seller.item_id);
        seller_arr.append(seller.price.into());
        seller_arr.append(seller.salt);
        let seller_commitment = poseidon_hash_span(seller_arr.span());

        // Return the public facts (commitments) that will be sent on-chain
        (buyer_commitment, seller_commitment)
    }
}