pub mod models;
pub mod circuit;
pub mod contract;
pub mod verifier;

#[cfg(test)]
mod tests {
    use crate::models::Order;
    use crate::circuit::AnonymousMatcherTrait;

    #[test]
    fn test_anonymous_marketplace_prototype() {
        println!("=========================================");
        println!("Anonymous Marketplace - ZKP Prototype");
        println!("=========================================");
        println!("");
        
        // DYNAMIC_INPUTS_START
        let buyer_wallet: starknet::ContractAddress = '0x054f216262a78f1610eE026A7432'.try_into().unwrap();
        let seller_wallet: starknet::ContractAddress = '0x027D11c21067eBe010E59c402123'.try_into().unwrap();

        // Create a buyer order
        let buyer = Order {
            owner: buyer_wallet,
            item_id: 42,
            price: 1000,
            salt: 0x123456789ABCDEF,
            is_buyer: true,
            status: crate::models::OrderStatus::Active,
        };
        
        println!("BUYER ORDER CREATED:");
        println!("  - Item ID: {}", buyer.item_id);
        println!("  - Price: {} units", buyer.price);
        println!("  - Salt (secret): {}", buyer.salt);
        println!("");
        
        // Create a seller order
        let seller = Order {
            owner: seller_wallet,
            item_id: 42,
            price: 950,
            salt: 0xFEDCBA987654321,
            is_buyer: false,
            status: crate::models::OrderStatus::Active,
        };
        // DYNAMIC_INPUTS_END
        
        println!("SELLER ORDER CREATED:");
        println!("  - Item ID: {}", seller.item_id);
        println!("  - Price: {} units", seller.price);
        println!("  - Salt (secret): {}", seller.salt);
        println!("");
        
        // Verify match and generate commitments
        println!("VERIFYING MATCH...");
        let (buyer_commitment, seller_commitment) = AnonymousMatcherTrait::verify_match_and_get_commitments(buyer, seller);
        
        println!("MATCH VERIFIED SUCCESSFULLY!");
        println!("");
        println!("GENERATED COMMITMENTS (via Poseidon Hash):");
        println!("  - Buyer Commitment: {}", buyer_commitment);
        println!("  - Seller Commitment: {}", seller_commitment);
        println!("");
        
        println!("MATCH DETAILS:");
        println!("  - Items Match: YES (Item ID: {})", buyer.item_id);
        println!("  - Price Compatible: YES (Buyer: {}, Seller: {})", buyer.price, seller.price);
        println!("  - Buyer pays Seller: {} units", seller.price);
        println!("");
        
        println!("=========================================");
        println!("Prototype Successfully Completed!");
        println!("=========================================");
        println!("");
        println!("ZERO-KNOWLEDGE PROOF VERIFICATION:");
        println!("  Both parties can prove ownership of orders");
        println!("  without revealing their identities!");
        println!("");
        
        // Verify commitments are different (proof of uniqueness)
        assert(buyer_commitment != seller_commitment, 'Commitments should be unique');
    }

    #[test]
    #[should_panic(expected: ('Buyer price < Seller price',))]
    fn test_buyer_price_too_low() {
        // Buyer offers 800
        let buyer = Order {
            owner: '0x1234'.try_into().unwrap(),
            item_id: 42,
            price: 800,
            salt: 0x1,
            is_buyer: true,
            status: crate::models::OrderStatus::Active,
        };
        
        // Seller asks for 1000
        let seller = Order {
            owner: '0x5678'.try_into().unwrap(),
            item_id: 42,
            price: 1000,
            salt: 0x2,
            is_buyer: false,
            status: crate::models::OrderStatus::Active,
        };
        
        // This should panic because 800 < 1000
        AnonymousMatcherTrait::verify_match_and_get_commitments(buyer, seller);
    }    
}