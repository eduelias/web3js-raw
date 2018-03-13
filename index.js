/*
web3js-raw
Reusable set of functions to send transactions using sendRawTransaction of web3js
 * Copyright(c) 2018-2018 Chim Himidumage
 * MIT Licensed
*/

'use strict'

var Web3 = require('web3'); // https://www.npmjs.com/package/web3
var Web3Utils = require('web3-utils');
var Web3EthAccounts = require('web3-eth-accounts');
var Tx = require('ethereumjs-tx');
var coder = require('web3/lib/solidity/coder');
var CryptoJS = require('crypto-js');

var web3 = new Web3();


//Support Functions
module.exports = function() {

    this.ContractInstance;

    this.setWeb3 = function(web3) {
        this.web3 = web3;
    }

    this.setWsProvider = function(wsProviderAddress) {
        web3.setProvider(new web3.providers.WebsocketProvider(wsProviderAddress));
    }

    this.setProvider = function(provider) {
        web3.setProvider(new web3.providers.HttpProvider(provider));
    }

    this.createContractInstance = function(contractABI, contractAddress) {
        var _contract = web3.eth.contract(contractABI);
        this.ContractInstance = _contract.at(contractAddress);
    }

    this.encodeFunctionParams = function(methodName, types, args) {
        var fullName = methodName + '(' + types.join() + ')';

        var signature = CryptoJS.SHA3(fullName, { outputLength: 256 }).toString(CryptoJS.enc.Hex).slice(0, 8);
        var dataHex = signature + coder.encodeParams(types, args);
        var payload = '0x' + dataHex;

        return payload;
    }

    this.encodeConstructorParams = function(abi, params) {
        return abi.filter(function(json) {
            return json.type === 'constructor' && json.inputs.length === params.length;
        }).map(function(json) {
            return json.inputs.map(function(input) {
                return input.type;
            });
        }).map(function(types) {
            return coder.encodeParams(types, params);
        })[0] || '';
    };

    this.getSignedTransaction = function(txnRawData, pvtKey) {
        var tx = new Tx(txnRawData);
        tx.sign(pvtKey);
        var serializedTx = '0x' + tx.serialize().toString('hex');

        return serializedTx;
    }

    this.createNewAccount = async function(callback) {
        var retObj = await account.create();
        var str = "Create Acc      : \n" +
            "   hash         : " + retObj.address + "\n" +
            "   private key  : " + retObj.privateKey;
        console.log(str);

        callback({ "status": 1, "functionName": "createNewAccount", "message": retObj });
    }

    this.invokeSendRawTransaction = async function(functionName, transactionPayload, callback) {
        await web3.eth.sendRawTransaction(transactionPayload, function(error, txHash) {
            if (!error) {
                callback({ "status": 1, "functionName": functionName, "message": txHash });
            } else {
                callback({ "status": 0, "functionName": functionName, "message": error });
            }
        });
    }

    this.invokeGetTxnReceipt = async function(tx_hash, callback) {
        var e = await web3.eth.getTransaction(tx_hash);
        callback({ "status": 1, "invokeGetTxnReceipt": "invokeGetTxnReceipt", "message": e });
    }

    this.getDefaultTxnAttributes = function(nonce, fromAddress, toAddress, valueInEther, dataAsHex, gasLimit, gasPrice) {

        var TxnAttributes = {
            nonce: '0x00',
            from: '0x00',
            to: '0x00',
            value: '0x00',
            data: '0x00',
            gasLimit: '0x00',
            gasPrice: '0x00'
        };

        if (nonce == '')
            nonce = web3.toHex(web3.eth.getTransactionCount(fromAddress));
        TxnAttributes.nonce = nonce;

        TxnAttributes.from = fromAddress;
        TxnAttributes.to = toAddress;
        TxnAttributes.value = web3.toHex(Web3Utils.toWei(valueInEther, 'ether'));
        TxnAttributes.data = dataAsHex;

        if (gasLimit == '')
            gasLimit = 4500000;
        TxnAttributes.gasLimit = web3.toHex(gasLimit);

        if (gasPrice == '')
            gasPrice = web3.eth.gasPrice;
        TxnAttributes.gasPrice = web3.toHex(gasPrice);

        return TxnAttributes;
    }
}