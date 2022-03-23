// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./YourToken.sol";

contract Vendor is Ownable {
  uint256 public constant tokensPerEth = 100;
  event BuyTokens(address indexed buyer, uint256 amountOfETH, uint256 amountOfTokens);
  event SellTokens(address indexed seller, uint256 amountOfETH, uint256 amountOfTokens);

  YourToken public yourToken;

  constructor(address tokenAddress) {
    yourToken = YourToken(tokenAddress);
  }

  // ToDo: create a payable buyTokens() function:
  function buyTokens() public payable {
    uint256 amountOfTokens;
    require(msg.value > 0, "insufficient balance to buy tokens");
    unchecked {
      amountOfTokens = msg.value * tokensPerEth;
    }
    // check if the Vendor Contract has enough amount of tokens for the transaction
    uint256 vendorTokenBalance = yourToken.balanceOf(address(this));
    require(vendorTokenBalance >= amountOfTokens, "Vendor contract has not enough tokens in its balance");
    // transfer tokens to buyer
    yourToken.transfer(msg.sender, amountOfTokens);
    emit BuyTokens(msg.sender, msg.value, amountOfTokens);
  }

  // ToDo: create a withdraw() function that lets the owner withdraw ETH
  function withdraw () public payable onlyOwner {
    uint256 vendorEthBalance = address(this).balance;
    require(vendorEthBalance > 0, "Vendor has no balance to withdraw");

    (bool sent,) = msg.sender.call{value: address(this).balance}("");
    require(sent, "Failed to send user ETH to owner");
  }

  // ToDo: create a sellTokens() function:
  function sellTokens(uint256 amountOfTokensForSell) public {
    uint256 sellerTokenBalance = yourToken.balanceOf(msg.sender);
    uint256 VendorEthBalance = address(this).balance;
    uint256 amountOfEthToTransferToUser;
    unchecked {
      amountOfEthToTransferToUser = amountOfTokensForSell/tokensPerEth;
    }
    require(amountOfTokensForSell > 0, "Enter an amount greater than 0");
    //check user's token balance is enough for sell
    require(sellerTokenBalance >= amountOfTokensForSell, "User: Insufficient balance to carry out sale");
    // check if vendor has enough ETH/balance for swap
    require(VendorEthBalance >= amountOfEthToTransferToUser, "Vendor: Insufficient balance to carry out sale ");
    // send tokens from user to vendor
    (bool sent) = yourToken.transferFrom(msg.sender, address(this), amountOfTokensForSell);
    require(sent, "Failed to transfer tokens");
    // send ETH from vendor to user
    payable(msg.sender).transfer(amountOfEthToTransferToUser);
    emit SellTokens(msg.sender, amountOfEthToTransferToUser, amountOfTokensForSell);
  }

}




