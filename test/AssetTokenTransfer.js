// Copyright (c) 2017-2018 Clearmatics Technologies Ltd

// SPDX-License-Identifier: LGPL-3.0+

const AssetToken = artifacts.require('AssetToken');
const MockReceivingContract = artifacts.require(`MockReceivingContract`);
const NotAReceivingContract = artifacts.require(`NotAReceivingContract`);

let CONTRACT;

contract('AssetTokenTransfer', (accounts) => {
    const addrOwner = accounts[0];
    beforeEach(async () => {
        CONTRACT = await AssetToken.new("CLR", "Asset Token", { from: addrOwner });
    });

    it('Can transfer tokens from External Owned Account(EOA) to EOA', async () => {
        const addrSender = accounts[1];
        const addrRecipient = accounts[2];

        const totalSupplyStart = await CONTRACT.totalSupply.call();
        const balanceSenderStart = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientStart = await CONTRACT.balanceOf.call(addrRecipient);

        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrSender, fundVal, { from: addrOwner });

        const totalSupplyFund = await CONTRACT.totalSupply.call();
        const balanceSenderFund = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientFund = await CONTRACT.balanceOf.call(addrRecipient);

        const transferVal = 50;
        const transferRes = await CONTRACT.transferNoData(addrRecipient, transferVal, { from: addrSender });

        const totalSupplyAfterTransfer = await CONTRACT.totalSupply.call();
        const balanceSenderAfterTransfer = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientAfterTransfer = await CONTRACT.balanceOf.call(addrRecipient);

        const transferEvent = transferRes.logs.find(element => element.event.match('Transfer'));
        const transferEventFrom = transferEvent.args.from;
        const transferEventTo = transferEvent.args.to;
        const transferEventValue = transferEvent.args.value.toNumber()

        assert(transferEvent != null);
        assert.strictEqual(transferEventFrom, addrSender);
        assert.strictEqual(transferEventTo, addrRecipient);
        assert.strictEqual(transferEventValue, transferVal);

        assert.strictEqual(totalSupplyStart.toNumber() + fundVal, totalSupplyFund.toNumber());
        assert.strictEqual(balanceSenderStart.toNumber() + fundVal, balanceSenderFund.toNumber());
        assert.strictEqual(balanceRecipientStart.toNumber(), balanceRecipientFund.toNumber());

        assert.strictEqual(totalSupplyFund.toNumber(), totalSupplyAfterTransfer.toNumber());
        assert.strictEqual(balanceSenderFund.toNumber() - transferVal, balanceSenderAfterTransfer.toNumber());
        assert.strictEqual(balanceRecipientFund.toNumber() + transferVal, balanceRecipientAfterTransfer.toNumber());
    });

    it('Cannot transfer more tokens than in the account', async () => {
        const addrSender = accounts[1];
        const addrRecipient = accounts[2];

        const totalSupplyStart = await CONTRACT.totalSupply.call();
        const balanceSenderStart = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientStart = await CONTRACT.balanceOf.call(addrRecipient);

        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrSender, fundVal, { from: addrOwner });

        const totalSupplyFund = await CONTRACT.totalSupply.call();
        const balanceSenderFund = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientFund = await CONTRACT.balanceOf.call(addrRecipient);

        let actualError = null;
        try {
            const transferVal = balanceSenderFund.toNumber() + 50;
            const transferRes = await CONTRACT.transferNoData(addrRecipient, transferVal, { from: addrSender });
        } catch (error) {
            actualError = error;
        }

        const totalSupplyAfterTransfer = await CONTRACT.totalSupply.call();
        const balanceSenderAfterTransfer = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientAfterTransfer = await CONTRACT.balanceOf.call(addrRecipient);

        assert.strictEqual(totalSupplyStart.toNumber() + fundVal, totalSupplyFund.toNumber());
        assert.strictEqual(balanceSenderStart.toNumber() + fundVal, balanceSenderFund.toNumber());
        assert.strictEqual(balanceRecipientStart.toNumber(), balanceRecipientFund.toNumber());

        assert.strictEqual(totalSupplyFund.toNumber(), totalSupplyAfterTransfer.toNumber());
        assert.strictEqual(balanceSenderFund.toNumber(), balanceSenderAfterTransfer.toNumber());
        assert.strictEqual(balanceRecipientFund.toNumber(), balanceRecipientAfterTransfer.toNumber());

        assert.strictEqual(actualError.toString(),"Error: Returned error: VM Exception while processing transaction: revert -- Reason given: You must have sufficent balance to perform this operation.");
    });

    it('Contract Owner cannot be the sender in a transfer', async () => {
        const addrSender = addrOwner;
        const addrRecipient = accounts[1];

        const totalSupplyStart = await CONTRACT.totalSupply.call();
        const balanceSenderStart = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientStart = await CONTRACT.balanceOf.call(addrRecipient);

        let actualError = null;
        try {
            const transferVal = 50;
            const transferRes = await CONTRACT.transferNoData(addrRecipient, transferVal, { from: addrSender });
        } catch (error) {
            actualError = error;
        }

        const totalSupplyAfterTransfer = await CONTRACT.totalSupply.call();
        const balanceRecipientAfterTransfer = await CONTRACT.balanceOf.call(addrOwner);

        assert.strictEqual(totalSupplyStart.toNumber(), totalSupplyAfterTransfer.toNumber());
        assert.strictEqual(balanceRecipientStart.toNumber(), balanceRecipientAfterTransfer.toNumber());
        assert.strictEqual(actualError.toString(),"Error: Returned error: VM Exception while processing transaction: revert -- Reason given: The contract owner can not perform this operation.");

    });

    it('Contract Owner cannot be the recipient in a transfer', async () => {
        const addrSender = accounts[1];
        const addrRecipient = addrOwner;

        const totalSupplyStart = await CONTRACT.totalSupply.call();
        const balanceSenderStart = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientStart = await CONTRACT.balanceOf.call(addrRecipient);

        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrSender, fundVal, { from: addrOwner });

        const totalSupplyFund = await CONTRACT.totalSupply.call();
        const balanceSenderFund = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientFund = await CONTRACT.balanceOf.call(addrRecipient);

        let actualError = null;
        try {
            const transferVal = 50;
            const transferRes = await CONTRACT.transferNoData(addrRecipient, transferVal, { from: addrSender });
        } catch (error) {
            actualError = error;
        }

        const totalSupplyAfterTransfer = await CONTRACT.totalSupply.call();
        const balanceSenderAfterTransfer = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientAfterTransfer = await CONTRACT.balanceOf.call(addrOwner);

        assert.strictEqual(totalSupplyStart.toNumber() + fundVal, totalSupplyFund.toNumber());
        assert.strictEqual(balanceSenderStart.toNumber() + fundVal, balanceSenderFund.toNumber());
        assert.strictEqual(balanceRecipientStart.toNumber(), balanceRecipientFund.toNumber());

        assert.strictEqual(totalSupplyFund.toNumber(), totalSupplyAfterTransfer.toNumber());
        assert.strictEqual(balanceSenderFund.toNumber(), balanceSenderAfterTransfer.toNumber());
        assert.strictEqual(balanceRecipientFund.toNumber(), balanceRecipientAfterTransfer.toNumber());

        assert.strictEqual(actualError.toString(),"Error: Returned error: VM Exception while processing transaction: revert -- Reason given: The contract owner can not perform this operation.");

    });

    it('Can transfer tokens from External Owned Account(EOA) to a contract', async () => {
	let mockReceivingContract = await MockReceivingContract.new({ from: addrOwner });

        const addrSender = accounts[1];
        const addrRecipient = mockReceivingContract.address;

        const totalSupplyStart = await CONTRACT.totalSupply.call();
        const balanceSenderStart = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientStart = await CONTRACT.balanceOf.call(addrRecipient);

        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrSender, fundVal, { from: addrOwner });

        const totalSupplyFund = await CONTRACT.totalSupply.call();
        const balanceSenderFund = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientFund = await CONTRACT.balanceOf.call(addrRecipient);

        const transferVal = 50;
        const transferRes = await CONTRACT.transferNoData(addrRecipient, transferVal, { from: addrSender });

        const totalSupplyAfterTransfer = await CONTRACT.totalSupply.call();
        const balanceSenderAfterTransfer = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientAfterTransfer = await CONTRACT.balanceOf.call(addrRecipient);

        const transferEvent = transferRes.logs.find(element => element.event.match('Transfer'));
        const transferEventFrom = transferEvent.args.from;
        const transferEventTo = transferEvent.args.to;
        const transferEventValue = transferEvent.args.value.toNumber()

        assert(transferEvent != null);
        assert.strictEqual(transferEventFrom, addrSender);
        assert.strictEqual(transferEventTo, addrRecipient);
        assert.strictEqual(transferEventValue, transferVal);

        assert.strictEqual(totalSupplyStart.toNumber() + fundVal, totalSupplyFund.toNumber());
        assert.strictEqual(balanceSenderStart.toNumber() + fundVal, balanceSenderFund.toNumber());
        assert.strictEqual(balanceRecipientStart.toNumber(), balanceRecipientFund.toNumber());

        assert.strictEqual(totalSupplyFund.toNumber(), totalSupplyAfterTransfer.toNumber());
        assert.strictEqual(balanceSenderFund.toNumber() - transferVal, balanceSenderAfterTransfer.toNumber());
        assert.strictEqual(balanceRecipientFund.toNumber() + transferVal, balanceRecipientAfterTransfer.toNumber());
	
	const logs = await mockReceivingContract.getPastEvents("Called", {fromBlock: 0, toBlock: "latest"});
	assert.strictEqual(logs[0].event, "Called");
	assert.strictEqual(logs[0].returnValues.from, addrSender);
	assert.strictEqual(logs[0].returnValues.data, null);
	assert.strictEqual(logs[0].returnValues.value, transferVal.toString());
    });

    it('Can not transfer more tokens than an account has balance from External Owned Account(EOA) to a contract', async () => {
	let mockReceivingContract = await MockReceivingContract.new({ from: addrOwner });

        const addrSender = accounts[1];
        const addrRecipient = mockReceivingContract.address;

        const totalSupplyStart = await CONTRACT.totalSupply.call();
        const balanceSenderStart = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientStart = await CONTRACT.balanceOf.call(addrRecipient);

        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrSender, fundVal, { from: addrOwner });

        const totalSupplyFund = await CONTRACT.totalSupply.call();
        const balanceSenderFund = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientFund = await CONTRACT.balanceOf.call(addrRecipient);

        const transferVal = fundVal + 50;
        let actualError = null;
        try {
            const transferRes = await CONTRACT.transferNoData(addrRecipient, transferVal, { from: addrSender });
        } catch (error) {
            actualError = error;
        }

        const totalSupplyAfterTransfer = await CONTRACT.totalSupply.call();
        const balanceSenderAfterTransfer = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientAfterTransfer = await CONTRACT.balanceOf.call(addrRecipient);

        assert.strictEqual(totalSupplyStart.toNumber() + fundVal, totalSupplyFund.toNumber());
        assert.strictEqual(balanceSenderStart.toNumber() + fundVal, balanceSenderFund.toNumber());
        assert.strictEqual(balanceRecipientStart.toNumber(), balanceRecipientFund.toNumber());

        assert.strictEqual(totalSupplyFund.toNumber(), totalSupplyAfterTransfer.toNumber());
        assert.strictEqual(balanceSenderFund.toNumber(), balanceSenderAfterTransfer.toNumber());
        assert.strictEqual(balanceRecipientFund.toNumber(), balanceRecipientAfterTransfer.toNumber());

        assert.strictEqual(actualError.toString(),"Error: Returned error: VM Exception while processing transaction: revert -- Reason given: You must have sufficent balance to perform this operation.");
    });

    it('Can not transfer tokens from External Owned Account(EOA) to a contract without a recieving function', async () => {
	let notAReceivingContract = await NotAReceivingContract.new({ from: addrOwner });

        const addrSender = accounts[1];
        const addrRecipient = notAReceivingContract.address;

        const totalSupplyStart = await CONTRACT.totalSupply.call();
        const balanceSenderStart = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientStart = await CONTRACT.balanceOf.call(addrRecipient);

        const fundVal = 100;
        const fundRes = await CONTRACT.fund(addrSender, fundVal, { from: addrOwner });

        const totalSupplyFund = await CONTRACT.totalSupply.call();
        const balanceSenderFund = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientFund = await CONTRACT.balanceOf.call(addrRecipient);

        const transferVal = 50;
        let actualError = null;
        try {
            const transferRes = await CONTRACT.transferNoData(addrRecipient, transferVal, { from: addrSender });
        } catch (error) {
            actualError = error;
        }

        const totalSupplyAfterTransfer = await CONTRACT.totalSupply.call();
        const balanceSenderAfterTransfer = await CONTRACT.balanceOf.call(addrSender);
        const balanceRecipientAfterTransfer = await CONTRACT.balanceOf.call(addrRecipient);

        assert.strictEqual(totalSupplyStart.toNumber() + fundVal, totalSupplyFund.toNumber());
        assert.strictEqual(balanceSenderStart.toNumber() + fundVal, balanceSenderFund.toNumber());
        assert.strictEqual(balanceRecipientStart.toNumber(), balanceRecipientFund.toNumber());

        assert.strictEqual(totalSupplyFund.toNumber(), totalSupplyAfterTransfer.toNumber());
        assert.strictEqual(balanceSenderFund.toNumber(), balanceSenderAfterTransfer.toNumber());
        assert.strictEqual(balanceRecipientFund.toNumber(), balanceRecipientAfterTransfer.toNumber());

        assert.strictEqual(actualError.toString(),"Error: Returned error: VM Exception while processing transaction: revert");
    });

});
