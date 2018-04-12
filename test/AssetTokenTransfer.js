const AssetToken = artifacts.require('AssetToken');

let CONTRACT;

contract('AssetTokenTransfer', (accounts) => {
    const addrOwner = accounts[0];
    beforeEach(async () => {
        CONTRACT = await AssetToken.new("CLR", "Asset Token", { from: addrOwner });
    });

    it('Can transfer tokens from EOA to EOA', async () => {
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
        const transferRes = await CONTRACT.transfer(addrRecipient, transferVal, { from: addrSender });

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
            const transferRes = await CONTRACT.transfer(addrRecipient, transferVal, { from: addrSender });
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

        assert.strictEqual(actualError.toString(),"Error: VM Exception while processing transaction: revert");
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
            const transferRes = await CONTRACT.transfer(addrRecipient, transferVal, { from: addrSender });
        } catch (error) {
            actualError = error;
        }

        const totalSupplyAfterTransfer = await CONTRACT.totalSupply.call();
        const balanceRecipientAfterTransfer = await CONTRACT.balanceOf.call(addrOwner);

        assert.strictEqual(totalSupplyStart.toNumber(), totalSupplyAfterTransfer.toNumber());
        assert.strictEqual(balanceRecipientStart.toNumber(), balanceRecipientAfterTransfer.toNumber());
        assert.strictEqual(actualError.toString(),"Error: VM Exception while processing transaction: revert");

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
            const transferRes = await CONTRACT.transfer(addrRecipient, transferVal, { from: addrSender });
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

        assert.strictEqual(actualError.toString(),"Error: VM Exception while processing transaction: revert");

    });
});
