# **Phase 3: ZK Anonymous Buyer-Seller Relation System (Cairo)**

### Group Members:
•	Syed Muhammad Ahmer | BSCS23167
•	Mashhood Shafqat | BSCS23188
•	Ahmed Nadeem | BSCS23185

---

## **Research Objective Addressed**

1. **Computation Reduction:** Moving O(N) matching logic off-chain to a Cairo STARK circuit. The on-chain contract only verifies O(log N) STARK proofs and processes state transitions.
2. **Anonymity:** Using Poseidon cryptographic commitments and a Nullifier Tree to hide buyer/seller prices and item IDs, while proving mathematically that `buyer_price >= seller_price`.

---

## **Project Structure**

* `src/models.cairo` — Private input structures (Orders)
* `src/circuit.cairo` — Off-chain Cairo logic enforcing relation constraints
* `src/contract.cairo` — Starknet L2 smart contract acting as registry and escrow, managing the Nullifier tree

---

## **Reproducibility Instructions (How to Build & Run)**

### **Prerequisites**

Install Scarb (Cairo package manager):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh
```

---

### **1. Clone Repository**

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/zk_anonymous_marketplace.git
cd zk_anonymous_marketplace
```

---

### **2. Compile Contracts and Circuits**

```bash
scarb build
```

Output will be generated in:

* `target/dev/`
  containing:
* `.sierra.json`
* `.casm.json`

---

### **3. Format Code (Optional)**

```bash
scarb fmt
```

---

## **Threat Modeling & Edge Cases Handled (Phase 3)**

* **Underflow/Overflow Attacks:** Cairo safely panics on invalid integer operations.
* **Replay Attacks:** Handled via `nullifier_tree (LegacyMap)`. Once a commitment is settled, it is permanently nullified and cannot be reused.
