import { Network, Alchemy }  from 'alchemy-sdk';
const crypto = require('crypto');
const seedrandom = require('seedrandom');

const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const web3 = createAlchemyWeb3("https://eth-goerli.g.alchemy.com/v2/CH1V81ZMzVXNjIFWnRNNTTgY0nD_Twh6");
const whitelist = require("./whitelist.json");
const privateKey = '8cec9adbbe46465fc6268424bfba50b50e2a67e3ff0e523ab304304ce77011ca';
const secretKey = "_dontmesswiththesystem";

const packsABI = require('./abi/packsabi.json');
const packsContractAddress = "0xf9e376b9Ce73cd04Ff4F4aAeC22960D433CB1287";


const packsContract = new web3.eth.Contract(packsABI, packsContractAddress);

const alchemy = new Alchemy({
    apiKey: "CH1V81ZMzVXNjIFWnRNNTTgY0nD_Twh6",
    network: Network.ETH_GOERLI
});


export const connectWallet = async () => {
    if (window.ethereum) {
        try {
            const addressArray = await window.ethereum.request({
                method: "eth_requestAccounts",
            });

            const chainId = await window.ethereum.request({ method: 'eth_chainId' });

            if(chainId != "0x5"){
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x5' }],
                });
            }
            
            return {
                success: true,
                status: "Connected",
                address: addressArray[0],
            };
        } catch (err) {
            return {
                success: false,
                address: "",
                status: err.message,
            };
        }
    } else {
        return {
            success: false,
            address: "",
            status: "You must install MetaMask, a virtual Ethereum wallet, in your browser.",
        };
    }
};
  
export const getCurrentWalletConnected = async () => {
    if (window.ethereum) {
        try {
            const addressArray = await window.ethereum.request({
                method: "eth_accounts",
            });

            if (addressArray.length > 0) {

                return {
                    address: addressArray[0],
                    status: "connected",
                    success: true,
                };
            } else {
                return {
                    address: "",
                    status: "Connect your wallet",
                    success: false,
                };
            }
        } catch (err) {
            return {
                address: "",
                status: err.message,
                success: false,
            };
        }
    } else {
        return {
            address: "",
            status: "You must install MetaMask, a virtual Ethereum wallet, in your browser.",
            success: false
        };
    }
};


let response = {
    success: false,
    status: ""
};

const getCost = async () => {
    const result = await packsContract.methods.cost().call();
    const resultEther = web3.utils.fromWei(result, "ether");
    return resultEther;
};

export const getMintState = async () => {
    const result = await packsContract.methods.saleState().call();
    return result;
};

export const getPackSupply = async () => {
    let result = [];
    for (let index = 1; index <= 3; index++) {
        const maxsupply = await packsContract.methods.maxTokenSupply(index).call();
        const currentsupply = await packsContract.methods.currentSupply(index).call();
        result.push({
            id: index,
            current: currentsupply,
            max: maxsupply
        });
    }
    return result;
};

export const getPackNfts = async (wallectAddress) => {

    let itemArray = [];

    const result = await alchemy.nft.getNftsForOwner(wallectAddress, {
        contractAddresses : [packsContractAddress]
    });
    

    for (let index = 0; index < result.ownedNfts.length; index++) {
        let tokenId = result.ownedNfts[index].tokenId;
        let balance = result.ownedNfts[index].balance;
        let rawImg = result.ownedNfts[index].rawMetadata.image;
        var name = result.ownedNfts[index].rawMetadata.name;
        let image = rawImg?.replace('ipfs://', 'https://ipfs.io/ipfs/');
        itemArray.push({
            name: name,
            img: image,
            tokenId: Number(tokenId),
            balance: balance
        });
    }

    
    return itemArray;
};

export const getCardsNfts = async (wallectAddress) => {
    const cardContract = await packsContract.methods.cardContract().call();

    let itemArray = [];

    const result = await alchemy.nft.getNftsForOwner(wallectAddress, {
        contractAddresses : [cardContract]
    });
    

    for (let index = 0; index < result.ownedNfts.length; index++) {
        let tokenId = result.ownedNfts[index].tokenId;
        let balance = result.ownedNfts[index].balance;
        let rawImg = result.ownedNfts[index].rawMetadata.image;
        var name = result.ownedNfts[index].rawMetadata.name;
        let image = rawImg?.replace('ipfs://', 'https://ipfs.io/ipfs/');
        itemArray.push({
            name: name,
            img: image,
            tokenId: Number(tokenId),
            balance: balance
        });
    }
    
    return itemArray;
};


export const mintSingle = async (id, qty, wallectAddress) => {

    const costEther = await getCost();
    const costWEI = web3.utils.toWei(costEther, "ether");
    await packsContract.methods.mint(id, qty)
    .send({
      value: (costWEI * qty).toString(),
      from: wallectAddress,
      to: packsContractAddress
    })
    .then(function(receipt){
      console.log("receipt: ", receipt);
      response.success = true;
      response.status = `Minted ${qty} packs successfully`
    }).catch(function(error){
      console.log("error: ", error);
      response.success = false;
      response.status = "Something went wrong";
    });
  
    return response;
};


export const mintMutiple = async (ids, qtys, wallectAddress) => {
    const costEther = await getCost();
    const costWEI = web3.utils.toWei(costEther, "ether");
    const tqty = qtys.reduce((a, b) => a + b, 0);
    await packsContract.methods.mintBatch(ids, qtys)
    .send({
      value: (costWEI * tqty).toString(),
      from: wallectAddress,
      to: packsContractAddress
    })
    .then(function(receipt){
      console.log("receipt: ", receipt);
      response.success = true;
      response.status = `Minted ${tqty} packs successfully`
    }).catch(function(error){
      console.log("error: ", error);
      response.success = false;
      response.status = "Something went wrong";
    });
  
    return response;
};


// Pad the key to ensure it's 32 bytes long
function padKey(key) {
    const keyLength = 32; // Desired key length in bytes
    const keyBuffer = Buffer.alloc(keyLength);
    const keyBytes = Buffer.from(key);
    for (let i = 0; i < keyBytes.length && i < keyLength; i++) {
      keyBuffer[i] = keyBytes[i];
    }
    return keyBuffer;
}


export const encryptArrayValues = (array) => {
    const iv = crypto.randomBytes(16); // Generate a random initialization vector
    const cipher = crypto.createCipheriv("aes-256-cbc", padKey(secretKey), iv);
    let encryptedArray = cipher.update(JSON.stringify(array), "utf8", "hex");
    encryptedArray += cipher.final("hex");
    return iv.toString("hex") + encryptedArray;
}

export const decryptArrayValues = (encryptedArray) => {
    const iv = Buffer.from(encryptedArray.slice(0, 32), "hex"); // Get the initialization vector from the encrypted data
    const decipher = crypto.createDecipheriv("aes-256-cbc", padKey(secretKey), iv);
    let decryptedArray = decipher.update(encryptedArray.slice(32), "hex", "utf8");
    decryptedArray += decipher.final("utf8");
    return JSON.parse(decryptedArray);
}


// Function to sign the message
function signMessage(message, privateKey) {
    const signer = web3.eth.accounts.privateKeyToAccount(privateKey);
    const signature = signer.sign(message);
    return signature.signature;
}

export const mintWhitelist = async (userAddress) => {

    const whitelistEntry = whitelist.find(entry => (entry.address).toLowerCase() ===  (userAddress).toLowerCase());
    if (!whitelistEntry) {
        response.success = false;
        response.status = "User is not whitelisted."
        return response;
    }

    const maxQuantityAllowed = whitelistEntry.quantity;
    const nonce = await web3.eth.getTransactionCount(userAddress, 'latest');
    // Create the message hash using the desired parameters
    const messageHash = web3.utils.soliditySha3(userAddress, 1, maxQuantityAllowed, nonce);
    const signature = signMessage(messageHash, privateKey);

    await packsContract.methods.whitelistMint(1, maxQuantityAllowed, nonce, signature)
    .send({
      from: userAddress,
      to: packsContractAddress
    })
    .then(function(receipt){
      console.log("receipt: ", receipt);
      response.success = true;
      response.status = `Minted ${tqty} packs successfully`
    }).catch(function(error){
      console.log("error: ", error);
      response.success = false;
      response.status = "Something went wrong";
    });
  
    return response;
};

export const burnToMint = async (burnids, burnqtys, mintids, mintqtys, wallectAddress) => {

    const nonce = await web3.eth.getTransactionCount(wallectAddress, 'latest');
    const messageHash = web3.utils.soliditySha3(
        wallectAddress, 
        { type: 'uint256[]', value: burnids },
        { type: 'uint256[]', value: burnqtys },
        { type: 'uint256[]', value: mintids },
        { type: 'uint256[]', value: mintqtys },
        nonce
    );
    const signature = signMessage(messageHash, privateKey)

    const BurnMintParams = {
        ids: burnids,
        amounts: burnqtys,
        mintIds: mintids,
        mintAmounts: mintqtys,
        nonce: nonce
    };

    await packsContract.methods.burnToMint(BurnMintParams, signature)
    .send({
      from: wallectAddress,
      to: packsContractAddress
    })
    .then(function(receipt){
      console.log("receipt: ", receipt);
      response.success = true;
      response.status = `Cards reveal successfully`
    }).catch(function(error){
      console.log("error: ", error);
      response.success = false;
      response.status = "Something went wrong";
    });
  
    return response;
};


// utils/interact.js

// Array of objects with token data
const someData = [
    { tokenId: 1, quantity: 5 },
    { tokenId: 2, quantity: 7 },
    { tokenId: 3, quantity: 13 },
    { tokenId: 4, quantity: 5 },
    { tokenId: 5, quantity: 7 },
    { tokenId: 6, quantity: 13 },
    { tokenId: 7, quantity: 5 },
    { tokenId: 8, quantity: 7 },
    { tokenId: 9, quantity: 13 },
    { tokenId: 10, quantity: 5 },
    { tokenId: 11, quantity: 7 },
    { tokenId: 12, quantity: 13 },
    { tokenId: 13, quantity: 5 },
    { tokenId: 14, quantity: 7 },
    { tokenId: 15, quantity: 13 },
    { tokenId: 16, quantity: 5 },
    { tokenId: 17, quantity: 7 },
    { tokenId: 18, quantity: 13 },
  ];
  
// Function to generate random mint IDs
const generateRandomMintIds = async (count, ethAddress) => {
    const mintIds = [];
    const availableTokenIds = someData.map((tokenData) => tokenData.tokenId);
  
    // Generate a seed for the random number generator based on the ETH address
    const seed = parseInt(ethAddress.slice(2), 16);
  
    // Create a random number generator with the seed
    const rng = seedrandom(seed.toString());
  
    while (mintIds.length < count && availableTokenIds.length > 0) {
      const randomIndex = Math.floor(rng() * availableTokenIds.length);
      const tokenId = availableTokenIds[randomIndex];
      const tokenData = someData.find((data) => data.tokenId === tokenId);
  
      if (tokenData.quantity > 0) {
        mintIds.push(tokenId);
        tokenData.quantity--;
  
        if (tokenData.quantity === 0) {
          const indexToRemove = availableTokenIds.indexOf(tokenId);
          availableTokenIds.splice(indexToRemove, 1);
        }
      }
    }
  
    if (mintIds.length === 0) {
      return []; // Return an empty array if no mint IDs were generated
    }
  
    return mintIds;
  }

  // Hash function to generate a pseudo-random number based on a string
function hashString(string) {
    let hash = 0;
    if (string.length === 0) return hash;
    for (let i = 0; i < string.length; i++) {
      const char = string.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  // Function to generate random mint IDs
  function generateRandomMintIdsTwo(count, ethAddress) {
    const mintIds = [];
    const availableTokenIds = someData.map((tokenData) => tokenData.tokenId);
  
    // Generate a seed for the pseudo-random number generator based on the ETH address
    const seed = hashString(ethAddress);
  
    // Create a pseudo-random number generator with the seed
    const rng = createRNG(seed);
  
    while (mintIds.length < count && availableTokenIds.length > 0) {
      const randomIndex = Math.floor(rng() * availableTokenIds.length);
      const tokenId = availableTokenIds[randomIndex];
      const tokenData = someData.find((data) => data.tokenId === tokenId);
  
      if (tokenData.quantity > 0) {
        mintIds.push(tokenId);
        tokenData.quantity--;
  
        if (tokenData.quantity === 0) {
          const indexToRemove = availableTokenIds.indexOf(tokenId);
          availableTokenIds.splice(indexToRemove, 1);
        }
      }
    }
  
    if (mintIds.length === 0) {
      return []; // Return an empty array if no mint IDs were generated
    }
  
    return mintIds;
  }
  
  // Helper function to create a pseudo-random number generator based on a seed
  function createRNG(seed) {
    return function() {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
  }

  export const mintAvailableTokensForUser = async (address) => {
    console.log(someData);
    const mintIds = await generateRandomMintIds(4, address);
    const mintIds2 = await generateRandomMintIds(4, "0xCce70A929A0bcD0ff4c07bD6397681c7249A08C3");
    console.log("mintIds", mintIds);
    console.log("mintIds2", mintIds2);
    // const fromiD = generateRandomMintIdsTwo(4, address);
    // const fromiD2 = await generateRandomMintIds(4, "0xCce70A929A0bcD0ff4c07bD6397681c7249A08C3");
    // console.log("fromiD", fromiD);
    // console.log("fromiD2", fromiD2);
  }
  
  
  
  



export {
    getCost
}