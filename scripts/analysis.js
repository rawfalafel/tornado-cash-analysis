const TornadoCash = artifacts.require("TornadoCash");

async function run() {
  const contractData = [{
    amount: 1,
    address: "0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc",
    startBlock: 9116966
  }, {
    amount: 10,
    address: "0x47CE0C6eD5B0Ce3d3A51fdb1C52DC66a7c3c2936",
    startBlock: 9117609
  }, {
    amount: 100,
    address: "0x910Cbd523D972eb0a6f4cAe4618aD62622b39DbF",
    startBlock: 9117720
  }, {
    amount: 1000,
    address: "0xA160cdAB225685dA1d56aa342Ad8841c3b53f291",
    startBlock: 9161895
  }];

  /*
  {
    "deposit": <amount>,
    "withdrawal": <amount>
  }
  */
  const accounts = {};

  for (const data of contractData) {
    const contract = await TornadoCash.at(data.address);
    const deposits = await contract.getPastEvents("Deposit", { fromBlock: data.startBlock });
    const withdrawals = await contract.getPastEvents("Withdrawal", { fromBlock: data.startBlock });
    console.log("amount:", data.amount);
    console.log("deposits:", deposits.length);
    console.log("withdrawals:", withdrawals.length);

    // Track amount deposited and withdrawn for each unique address
    await countTxs(accounts, deposits, "deposit", data.amount);
    await countTxs(accounts, withdrawals, "withdrawal", data.amount);

    // Compute the average interval
    const currentBlock = await web3.eth.getBlockNumber();
    const firstBlock = withdrawals[0].blockNumber;
    const expectedInterval = Math.floor((currentBlock - firstBlock) / (withdrawals.length - 1));

    // Compute the median interval after a deposit
    const interval = [];

    deposits.forEach(deposit => {
      const nextWithdraw = withdrawals.find(withdraw => withdraw.blockNumber > deposit.blockNumber);
      if (!nextWithdraw) return;

      interval.push(nextWithdraw.blockNumber - deposit.blockNumber);
    });

    interval.sort((a, b) => (a - b));
    console.log(interval);
    const medianInterval = interval[Math.floor(interval.length / 2)];

    console.log("expected:", expectedInterval);
    console.log("median:", medianInterval);
    console.log("# accounts:", Object.keys(accounts).length);
  }

  const accounts_sorted = Object.keys(accounts).map(address =>
    [address, accounts[address].deposit, accounts[address].withdrawal]
  );

  accounts_sorted.sort((a, b) => (a[1] + a[2]) - (b[1] + b[2]));

  // accounts_sorted.forEach(data => console.log(data[0], data[1], data[2]));
}

async function countTxs(accounts, events, type, amount) {
  for (const event of events) {
    const tx = await web3.eth.getTransaction(event.transactionHash);
    if (!accounts[tx.from]) {
      accounts[tx.from] = { deposit: 0, withdrawal: 0 };
    }

    accounts[tx.from][type] += amount;
  }
}

module.exports = async function(callback) {
  try {
    await run();
  } catch (err) {
    console.error(err);
  }

  callback();
}
