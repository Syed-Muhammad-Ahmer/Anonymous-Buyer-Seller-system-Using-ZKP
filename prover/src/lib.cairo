use core::poseidon::poseidon_hash_span;
use starknet::ContractAddress;

mod input;

#[test]
fn test_prover_execution() {
    let operation = input::get_operation();

    if operation == 'commit' {
        let owner = input::get_buyer_owner();
        let item_id = input::get_buyer_item_id();
        let price = input::get_buyer_price();
        let salt = input::get_buyer_salt();

        let mut arr = ArrayTrait::new();
        arr.append(owner.into());
        arr.append(item_id);
        arr.append(price.into());
        arr.append(salt);
        let commitment = poseidon_hash_span(arr.span());
        println!("COMMITMENT={}", commitment);
    } else if operation == 'match' {
        let buyer_owner = input::get_buyer_owner();
        let buyer_item_id = input::get_buyer_item_id();
        let buyer_price = input::get_buyer_price();
        let buyer_salt = input::get_buyer_salt();

        let seller_owner = input::get_seller_owner();
        let seller_item_id = input::get_seller_item_id();
        let seller_price = input::get_seller_price();
        let seller_salt = input::get_seller_salt();

        // Verification Logic (Zk circuit rules)
        assert(buyer_item_id == seller_item_id, 'Item ID mismatch');
        let bp: u256 = buyer_price.into();
        let sp: u256 = seller_price.into();
        assert(bp >= sp, 'Buyer price < Seller price');

        // Compute Commitments
        let mut buyer_arr = ArrayTrait::new();
        buyer_arr.append(buyer_owner.into());
        buyer_arr.append(buyer_item_id);
        buyer_arr.append(buyer_price.into());
        buyer_arr.append(buyer_salt);
        let buyer_commitment = poseidon_hash_span(buyer_arr.span());

        let mut seller_arr = ArrayTrait::new();
        seller_arr.append(seller_owner.into());
        seller_arr.append(seller_item_id);
        seller_arr.append(seller_price.into());
        seller_arr.append(seller_salt);
        let seller_commitment = poseidon_hash_span(seller_arr.span());

        println!("BUYER_COMMITMENT={}", buyer_commitment);
        println!("SELLER_COMMITMENT={}", seller_commitment);
        println!("PROOF_GENERATED=true");
    }
}
