// SPDX-License-Identifier: MIT

pragma solidity 0.8.11;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

struct TransferRequest {
    uint256 expireAt;
    uint256 transferAmount;
}

contract Verifier is EIP712 {
    constructor(string memory name, string memory version)
        EIP712(name, version)
    {}

    function verifyAndTransfer(
        bytes memory signature,
        address signer,
        uint256 expireAt,
        uint256 transferAmount
    ) external {
        TransferRequest memory r = TransferRequest(expireAt, transferAmount);
        require(
            isCorrectSigner(signature, signer, r),
            "Verifier: invalid signer"
        );

        require(block.timestamp < expireAt, "Verifier: request expired");

        payable(msg.sender).transfer(transferAmount);
    }

    function isCorrectSigner(
        bytes memory signature,
        address signer,
        TransferRequest memory r
    ) public view returns (bool) {
        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256(
                        "TransferRequest(uint256 expireAt,uint256 transferAmount)"
                    ),
                    r.expireAt,
                    r.transferAmount
                )
            )
        );

        return ECDSA.recover(digest, signature) == signer;
    }
}
