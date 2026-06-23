
use starknet::ContractAddress;
#[feature("deprecated-starknet-consts")]

pub fn get_operation() -> felt252 { 'match' }

pub fn get_buyer_owner() -> ContractAddress { starknet::contract_address_const::<0x123>() }
pub fn get_buyer_item_id() -> felt252 { 42 }
pub fn get_buyer_price() -> felt252 { 100 }
pub fn get_buyer_salt() -> felt252 { 12345 }

pub fn get_seller_owner() -> ContractAddress { starknet::contract_address_const::<0x456>() }
pub fn get_seller_item_id() -> felt252 { 42 }
pub fn get_seller_price() -> felt252 { 50 }
pub fn get_seller_salt() -> felt252 { 54321 }
