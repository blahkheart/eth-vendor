//
// this script executes when you run 'yarn test'
//
// you can also test remote submissions like:
// CONTRACT_ADDRESS=0x43Ab1FCd430C1f20270C2470f857f7a006117bbb yarn test --network rinkeby
//
// you can even run mint commands if the tests pass like:
// yarn test && echo "PASSED" || echo "FAILED"
//

const hre = require("hardhat");
const { ethers } = hre;
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");
let contractOwner, secondAccount;

use(solidity);

beforeEach(async () => {
  // eslint-disable-next-line no-unused-vars
  [ contractOwner, secondAccount ] = await ethers.getSigners();
});

describe("๐ฉ Challenge 2: ๐ต Token Vendor ๐ค", function () {

  this.timeout(125000);

  let yourToken;



  if(process.env.CONTRACT_ADDRESS){
    // live contracts, token already deployed
  }else{
    it("Should deploy YourToken", async function () {
      const YourToken = await ethers.getContractFactory("YourToken");
      yourToken = await YourToken.deploy();
    });
    describe("totalSupply()", function () {

      it("Should have a total supply of at least 1000", async function () {

        const totalSupply = await yourToken.totalSupply();
        const totalSupplyInt = parseInt(ethers.utils.formatEther(totalSupply))
        console.log('\t'," ๐งพ Total Supply:",totalSupplyInt)
        expect(totalSupplyInt).to.greaterThan(999);

      });
    })

  }


  let vendor;

  if(process.env.CONTRACT_ADDRESS){
    it("Should connect to external contract", async function () {
      vendor = await ethers.getContractAt("Vendor",process.env.CONTRACT_ADDRESS);
      console.log(`\t`,"๐ฐ Connected to:",vendor.address)

      console.log(`\t`,"๐ก Loading the yourToken address from the Vendor...")
      console.log(`\t`,"โ ๏ธ Make sure *yourToken* is public in the Vendor.sol!")
      let tokenAddress = await vendor.yourToken();
      console.log('\t',"๐ท Token Address:",tokenAddress)

      yourToken = await ethers.getContractAt("YourToken",tokenAddress);
      console.log(`\t`,"๐ฐ Connected to YourToken at:",yourToken.address)
    });
  }else{
    it("Should deploy YourToken", async function () {
      const Vendor = await ethers.getContractFactory("Vendor");
      vendor = await Vendor.deploy(yourToken.address);

      console.log("Transferring 1000 tokens to the vendor...")
      await yourToken.transfer(
        vendor.address,
        ethers.utils.parseEther("1000")
      );
    });
  }

  describe("๐ต buyTokens()", function () {
    it("Should let us buy tokens and our balance should go up...", async function () {
      const [ owner ] = await ethers.getSigners();
      console.log('\t'," ๐งโ๐ซ Tester Address: ",owner.address)

      const startingBalance = await yourToken.balanceOf(owner.address)
      console.log('\t'," โ๏ธ Starting balance: ",ethers.utils.formatEther(startingBalance))

      console.log('\t'," ๐ธ Buying...")
      const buyTokensResult = await vendor.buyTokens({value: ethers.utils.parseEther("0.001")});
      console.log('\t'," ๐ท  buyTokens Result: ",buyTokensResult.hash)

      console.log('\t'," โณ Waiting for confirmation...")
      const txResult =  await buyTokensResult.wait()
      expect(txResult.status).to.equal(1);

      const newBalance = await yourToken.balanceOf(owner.address)
      console.log('\t'," ๐ New balance: ", ethers.utils.formatEther(newBalance))
      expect(newBalance).to.equal(startingBalance.add(ethers.utils.parseEther("0.1")));

    });
  })

  describe('withdraw() ETH', () => {
    it('withdraw reverted because called by not the owner', async () => {
      await expect(vendor.connect(secondAccount).withdraw()).to.be.revertedWith('Ownable: caller is not the owner');
      // console.log('withdraw should revert because of insufficient balance to withdraw');
      // const ownerETHBalance = await ethers.provider.getBalance(owner.address);
      // const vendorEthBalance = await ethers.provider.getBalance(vendor.address);
      // console.log('Owner ETH balance: ', ethers.utils.formatEther(ownerETHBalance));
      // console.log('vendor ETH balance: ', ethers.utils.formatEther(vendorEthBalance));
      // await expect(vendor.connect(owner).withdraw()).to.be.revertedWith('Owner has not balance to withdraw');
    });

   

    it('withdraw success', async () => {
      const ethOfTokenToBuy = ethers.utils.parseEther('1');

      // buyTokens operation
      await vendor.connect(secondAccount).buyTokens({
        value: ethOfTokenToBuy,
      });
      const vendorEthBalanceBeforeWithdraw = await ethers.provider.getBalance(vendor.address);
      
      // withdraw operation
      const txWithdraw = await vendor.connect(contractOwner).withdraw();

      // Check that the Vendor's balance has 0 ETH
      const vendorCurrentEthBalance = await ethers.provider.getBalance(vendor.address);
      expect(vendorCurrentEthBalance).to.equal(0);
      
      // Check the the owner balance has changed by vendor's ETH balance
      await expect(txWithdraw).to.changeEtherBalance(contractOwner, vendorEthBalanceBeforeWithdraw);
    });

    it('withdraw reverted because vendor has insufficient balance', async () => {
      const vendorEthBalance = await ethers.provider.getBalance(vendor.address);
      console.log('vendor ETH balance1: ', ethers.utils.formatEther(vendorEthBalance));
      await expect(vendor.connect(contractOwner).withdraw()).to.be.revertedWith('Vendor has no balance to withdraw');
    });
  });

  describe("๐ต sellTokens()", function () {
    it("Should let us sell tokens and we should get eth back...", async function () {
      const [owner] = await ethers.getSigners();
      
      // buy tokens to ensure vendor has ETH balance to accept sale
      // await vendor.connect(owner).buyTokens(ethers.utils.parseEther("10"));
      await vendor.connect(secondAccount).buyTokens({
        value: ethers.utils.parseEther('1'),
      });

      const startingETHBalance = await ethers.provider.getBalance(owner.address)
      console.log('\t'," โ๏ธ Starting ETH balance: ",ethers.utils.formatEther(startingETHBalance))

      const startingBalance = await yourToken.balanceOf(owner.address)
      console.log('\t'," โ๏ธ Starting balance: ",ethers.utils.formatEther(startingBalance))

      console.log('\t'," ๐ Approving...")
      const approveTokensResult = await yourToken.approve(vendor.address, ethers.utils.parseEther("0.1"));
      console.log('\t'," ๐ท  approveTokens Result Result: ",approveTokensResult.hash)

      console.log('\t'," โณ Waiting for confirmation...")
      const atxResult =  await approveTokensResult.wait()
      expect(atxResult.status).to.equal(1);
      
      console.log('\t', " ๐พ Selling...")
      const tokenAmountToSell = ethers.utils.parseEther("0.1");
      const sellTokensResult = await vendor.sellTokens(tokenAmountToSell);
      console.log('\t'," ๐ท  sellTokens Result: ",sellTokensResult.hash)

      console.log('\t'," โณ Waiting for confirmation...")
      const txResult =  await sellTokensResult.wait()
      expect(txResult.status).to.equal(1);

      const newBalance = await yourToken.balanceOf(owner.address)
      console.log('\t'," ๐ New balance: ", ethers.utils.formatEther(newBalance))
      expect(newBalance).to.equal(startingBalance.sub(tokenAmountToSell));

      const newETHBalance = await ethers.provider.getBalance(owner.address)
      console.log('\t'," ๐ New ETH balance: ", ethers.utils.formatEther(newETHBalance))
      const ethChange = newETHBalance.sub(startingETHBalance).toNumber()
      expect(ethChange).to.greaterThan(100000000000000);
      
      // expect(sellTokensResult).to.changeEtherBalance(owner, tokenAmountToSell);
      // expect(sellTokensResult).to.changeEtherBalance(owner, ethers.utils.parseEther("0.1"));

    });
  })







  //console.log("hre:",Object.keys(hre)) // <-- you can access the hardhat runtime env here
  /*
  describe("Staker", function () {

    if(process.env.CONTRACT_ADDRESS){
      it("Should connect to external contract", async function () {
        stakerContract = await ethers.getContractAt("Staker",process.env.CONTRACT_ADDRESS);
        console.log("     ๐ฐ Connected to external contract",myContract.address)
      });
    }else{
      it("Should deploy ExampleExternalContract", async function () {
        const ExampleExternalContract = await ethers.getContractFactory("ExampleExternalContract");
        exampleExternalContract = await ExampleExternalContract.deploy();
      });
      it("Should deploy Staker", async function () {
        const Staker = await ethers.getContractFactory("Staker");
        stakerContract = await Staker.deploy(exampleExternalContract.address);
      });
    }

    describe("mintItem()", function () {
      it("Balance should go up when you stake()", async function () {
        const [ owner ] = await ethers.getSigners();

        console.log('\t'," ๐งโ๐ซ Tester Address: ",owner.address)

        const startingBalance = await stakerContract.balances(owner.address)
        console.log('\t'," โ๏ธ Starting balance: ",startingBalance.toNumber())

        console.log('\t'," ๐จ Staking...")
        const stakeResult = await stakerContract.stake({value: ethers.utils.parseEther("0.001")});
        console.log('\t'," ๐ท  stakeResult: ",stakeResult.hash)

        console.log('\t'," โณ Waiting for confirmation...")
        const txResult =  await stakeResult.wait()
        expect(txResult.status).to.equal(1);

        const newBalance = await stakerContract.balances(owner.address)
        console.log('\t'," ๐ New balance: ", ethers.utils.formatEther(newBalance))
        expect(newBalance).to.equal(startingBalance.add(ethers.utils.parseEther("0.001")));

      });


      if(process.env.CONTRACT_ADDRESS){
        console.log(" ๐คท since we will run this test on a live contract this is as far as the automated tests will go...")
      }else{

        it("If enough is staked and time has passed, you should be able to complete", async function () {

          const timeLeft1 = await stakerContract.timeLeft()
          console.log('\t',"โฑ There should be some time left: ",timeLeft1.toNumber())
          expect(timeLeft1.toNumber()).to.greaterThan(0);


          console.log('\t'," ๐ Staking a full eth!")
          const stakeResult = await stakerContract.stake({value: ethers.utils.parseEther("1")});
          console.log('\t'," ๐ท  stakeResult: ",stakeResult.hash)

          console.log('\t'," โ๏ธ fast forward time...")
          await network.provider.send("evm_increaseTime", [3600])
          await network.provider.send("evm_mine")

          const timeLeft2 = await stakerContract.timeLeft()
          console.log('\t',"โฑ Time should be up now: ",timeLeft2.toNumber())
          expect(timeLeft2.toNumber()).to.equal(0);

          console.log('\t'," ๐ calling execute")
          const execResult = await stakerContract.execute();
          console.log('\t'," ๐ท  execResult: ",execResult.hash)

          const result = await exampleExternalContract.completed()
          console.log('\t'," ๐ฅ complete: ",result)
          expect(result).to.equal(true);

        })
      }


      it("Should redeploy Staker, stake, not get enough, and withdraw", async function () {
        const [ owner, secondAccount ] = await ethers.getSigners();

        const ExampleExternalContract = await ethers.getContractFactory("ExampleExternalContract");
        exampleExternalContract = await ExampleExternalContract.deploy();

        const Staker = await ethers.getContractFactory("Staker");
        stakerContract = await Staker.deploy(exampleExternalContract.address);

        console.log('\t'," ๐จ Staking...")
        const stakeResult = await stakerContract.stake({value: ethers.utils.parseEther("0.001")});
        console.log('\t'," ๐ท  stakeResult: ",stakeResult.hash)

        console.log('\t'," โณ Waiting for confirmation...")
        const txResult =  await stakeResult.wait()
        expect(txResult.status).to.equal(1);

        console.log('\t'," โ๏ธ fast forward time...")
        await network.provider.send("evm_increaseTime", [3600])
        await network.provider.send("evm_mine")

        console.log('\t'," ๐ calling execute")
        const execResult = await stakerContract.execute();
        console.log('\t'," ๐ท  execResult: ",execResult.hash)

        const result = await exampleExternalContract.completed()
        console.log('\t'," ๐ฅ complete should be false: ",result)
        expect(result).to.equal(false);


        const startingBalance = await ethers.provider.getBalance(secondAccount.address);
        //console.log("startingBalance before withdraw", ethers.utils.formatEther(startingBalance))

        console.log('\t'," ๐ต calling withdraw")
        const withdrawResult = await stakerContract.withdraw(secondAccount.address);
        console.log('\t'," ๐ท  withdrawResult: ",withdrawResult.hash)

        const endingBalance = await ethers.provider.getBalance(secondAccount.address);
        //console.log("endingBalance after withdraw", ethers.utils.formatEther(endingBalance))

        expect(endingBalance).to.equal(startingBalance.add(ethers.utils.parseEther("0.001")));


      });

    });
  });*/
});
