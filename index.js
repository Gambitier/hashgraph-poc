require('dotenv').config();
const {
	Client,
	PrivateKey,
	AccountCreateTransaction,
	AccountBalanceQuery,
	Hbar,
	TransferTransaction,
} = require('@hashgraph/sdk');

async function environmentSetup() {
	// Grab your Hedera testnet account ID and private key from your .env file
	const myAccountId = process.env.MY_ACCOUNT_ID;
	const myPrivateKey = process.env.MY_PRIVATE_KEY;

	// If we weren't able to grab it, we should throw a new error
	if (myAccountId == null || myPrivateKey == null) {
		throw new Error(
			'Environment variables myAccountId and myPrivateKey must be present'
		);
	}

	// Create your connection to the Hedera Network
	const client = Client.forTestnet()
		.setOperator(myAccountId, myPrivateKey)
		.setDefaultMaxTransactionFee(new Hbar(100))
		.setMaxQueryPayment(new Hbar(50));

	const myAccountInitialBalance = await getAccountBalance(myAccountId, client);

	console.log(
		`The my account initial balance is: ${myAccountInitialBalance.hbars.toTinybars()} tinybar.`
	);

	// -----------------
	// Create new keys
	const Account1Id = await createNewAccountAndPrintDetails(client);
	const Account2Id = await createNewAccountAndPrintDetails(client);

	// -------- transaction ----------
	const transactionAmount = 100;
	//Create the transfer transaction
	const sendHbar = await createNewTransaction(
		myAccountId,
		Account1Id,
		transactionAmount,
		client
	);
	console.log('\n\n----transaction completeed----\n\n');

	//Verify the transaction reached consensus
	const transactionReceipt = await sendHbar.getReceipt(client);
	console.log(
		'The transfer transaction from my account to the new account was: ' +
			transactionReceipt.status.toString()
	);

	await printAccountBalance(Account1Id, client);
	await printAccountBalance(Account2Id, client);

	return Account1Id;
}

console.log('\n\n----------------------------');
environmentSetup()
	.then((accountId) => console.log(`\n\nexecution completed`))
	.catch((err) => console.error(err));

async function createNewTransaction(
	fromAccountId,
	toAccountId,
	transactionAmount,
	client
) {
	return await new TransferTransaction()
		.addHbarTransfer(fromAccountId, Hbar.fromTinybars(-1 * transactionAmount)) //Sending account
		.addHbarTransfer(toAccountId, Hbar.fromTinybars(transactionAmount)) //Receiving account
		.execute(client);
}

async function createNewAccountAndPrintDetails(client) {
	const account1 = await createNewAccount(client);

	// Get the new account ID
	const getReceiptAccount1 = await account1.getReceipt(client);
	const AccountId = getReceiptAccount1.accountId;

	console.log(`\nNew Account Id: ${AccountId}`);

	await printAccountBalance(AccountId, client);

	return AccountId;
}

async function printAccountBalance(Account1Id, client) {
	const account1Balance = await getAccountBalance(Account1Id, client);

	console.log(
		`The account ${Account1Id} balance is: ${account1Balance.hbars.toTinybars()} tinybar.`
	);
}

async function createNewAccount(client) {
	const newAccountPrivateKey = PrivateKey.generateED25519();
	const newAccountPublicKey = newAccountPrivateKey.publicKey;

	// Create a new account with 1,000 tinybar starting balance
	const newAccount = await new AccountCreateTransaction()
		.setKey(newAccountPublicKey)
		.setInitialBalance(Hbar.fromTinybars(1000))
		.execute(client);
	return newAccount;
}

async function getAccountBalance(newAccountId, client) {
	return await new AccountBalanceQuery()
		.setAccountId(newAccountId)
		.execute(client);
}
