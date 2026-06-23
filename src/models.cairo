use starknet::ContractAddress;

#[derive(Drop, Copy, Serde, starknet::Store)]
pub enum OrderStatus {
    #[default]
    Active,
    Matched,
    Cancelled,
}

#[derive(Drop, Copy, Serde, starknet::Store)]
pub struct Order {
    pub owner: ContractAddress,
    pub item_id: felt252,
    pub price: u64,
    pub salt: felt252,
    pub is_buyer: bool,
    pub status: OrderStatus,
}