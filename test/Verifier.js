const { expect } = require("chai");
const { ethers, network } = require("hardhat");

const {
  getContractFactory,
  utils: { parseUnits },
} = ethers;

const name = "Verifier";
const version = "1";
const transferAmount = parseUnits("0.1", "ether");

describe("Verifier", () => {
  let verifier, owner;

  before("setup instances", async () => {
    verifier = await (
      await getContractFactory("Verifier")
    ).deploy(name, version);

    [owner] = await ethers.getSigners();
  });

  describe("isCorrectSigner", () => {
    it("should return true for valid signature and signer", async () => {
      const request = {
        expireAt: (await ethers.provider.getBlock("latest")).number,
        transferAmount,
      };

      let data = await getStruct(request, verifier.address);

      const signedData = await owner._signTypedData(
        data.domain,
        data.types,
        data.message
      );

      expect(await verifier.isCorrectSigner(signedData, owner.address, request))
        .to.be.true;
    });
  });

  describe("verifyAndTransfer", () => {
    it("should revert if signer is not the same as argument", async () => {
      const request = {
        expireAt: (await ethers.provider.getBlock("latest")).number,
        transferAmount,
      };

      let data = await getStruct(request, verifier.address);

      const signedData = await owner._signTypedData(
        data.domain,
        data.types,
        data.message
      );

      await expect(
        verifier.verifyAndTransfer(
          signedData,
          (
            await ethers.getSigners()
          )[1].address,
          request.expireAt,
          transferAmount
        )
      ).to.be.revertedWith("Verifier: invalid signer");
    });

    it("should revert if request is expired", async () => {
      const request = {
        expireAt: (await ethers.provider.getBlock("latest")).number - 1,
        transferAmount,
      };

      let data = await getStruct(request, verifier.address);

      const signedData = await owner._signTypedData(
        data.domain,
        data.types,
        data.message
      );

      await expect(
        verifier.verifyAndTransfer(
          signedData,
          owner.address,
          request.expireAt,
          transferAmount
        )
      ).to.be.revertedWith("Verifier: request expired");
    });
  });
});

const getStruct = async (message, verifyingContract) => ({
  types: {
    TransferRequest: [
      { name: "expireAt", type: "uint256" },
      { name: "transferAmount", type: "uint256" },
    ],
  },
  domain: { name, version, chainId: network.config.chainId, verifyingContract },
  primaryType: "TransferRequest",
  message,
});
