use core::poseidon::poseidon_hash_span;
use super::models::Order;

#[generate_trait]
pub impl AnonymousMatcher of AnonymousMatcherTrait {
    fn verify_match_and_get_commitments(buyer: Order, seller: Order) -> (felt252, felt252) {
        assert(buyer.item_id == seller.item_id, 'Item ID mismatch');
        
        assert(buyer.price >= seller.price, 'Buyer price < Seller price');

        let mut buyer_arr = ArrayTrait::new();
        buyer_arr.append(buyer.owner.into());
        buyer_arr.append(buyer.item_id);
        buyer_arr.append(buyer.price.into());
        buyer_arr.append(buyer.salt);
        let buyer_commitment = poseidon_hash_span(buyer_arr.span());

        let mut seller_arr = ArrayTrait::new();
        seller_arr.append(seller.owner.into());
        seller_arr.append(seller.item_id);
        seller_arr.append(seller.price.into());
        seller_arr.append(seller.salt);
        let seller_commitment = poseidon_hash_span(seller_arr.span());

        (buyer_commitment, seller_commitment)
    }
}