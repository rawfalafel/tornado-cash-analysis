const fs = require("fs");
const util = require("util");
const yaml = require("js-yaml");

const writeFile = util.promisify(fs.writeFile);

const TornadoCash = artifacts.require("TornadoCash");

async function run() {
  const contractData = [{
    amount: 0.1,
    address: "0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc",
    startBlock: 9116966
  }, {
    amount: 1,
    address: "0x47CE0C6eD5B0Ce3d3A51fdb1C52DC66a7c3c2936",
    startBlock: 9117609
  }, {
    amount: 10,
    address: "0x910Cbd523D972eb0a6f4cAe4618aD62622b39DbF",
    startBlock: 9117720
  }, {
    amount: 100,
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
  const intervals = [];

  for (const data of contractData) {
    const contract = await TornadoCash.at(data.address);
    const deposits = await contract.getPastEvents("Deposit", { fromBlock: data.startBlock });
    const withdrawals = await contract.getPastEvents("Withdrawal", { fromBlock: data.startBlock });

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
    await writeFile(`data/interval-${data.amount}.yml`, yaml.safeDump(interval));

    const medianInterval = interval[Math.floor(interval.length / 2)];

    intervals.push({
      amount: data.amount,
      expected: expectedInterval,
      median: medianInterval
    });
  }

  await writeFile('data/intervals.yml', yaml.safeDump(intervals));

  // Convert denomination back to ETH
  Object.keys(accounts).forEach(address => {
    const account = accounts[address];
    account.deposit = accounts[address].deposit / 10;
    account.withdrawal = accounts[address].withdrawal / 10;
  });

  // Sort unique addresses by (deposit + withdrawal)
  await writeFile('data/accounts.yml', yaml.safeDump(accounts, {
    sortKeys: (a, b) => {
      // sortKeys attempts to sort nested objects as well.
      // Handle these as a special case.
      if (a == "deposit") return -1;
      if (b == "deposit") return 1;

      a = accounts[a];
      b = accounts[b];
      return a.deposit + a.withdrawal - (b.deposit + b.withdrawal);
    }
  }));
}

async function countTxs(accounts, events, type, amount) {
  for (const event of events) {
    const tx = await web3.eth.getTransaction(event.transactionHash);
    if (!accounts[tx.from]) {
      accounts[tx.from] = { deposit: 0, withdrawal: 0 };
    }

    // Note: Track amount as (ETH * 10) b/c Javascript numbers can't express decimals precisely
    accounts[tx.from][type] += amount * 10;
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
