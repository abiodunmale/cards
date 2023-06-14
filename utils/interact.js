const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const web3 = createAlchemyWeb3("https://eth-goerli.g.alchemy.com/v2/CH1V81ZMzVXNjIFWnRNNTTgY0nD_Twh6");


const packsABI = require('./abi/packsabi.json');
const packsContractAddress = "0x7ceA140eC119ad552c5fCc4D4d3210978cD26870";


const packsContract = new web3.eth.Contract(packsABI, packsContractAddress);


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
    const result = await packsContract.methods.saleActive().call();
    return result;
};

export const getPackSupply = async () => {
    let result = [];
    for (let index = 1; index <= 3; index++) {
        const maxsupply = await packsContract.methods.packMaxSupply(index).call();
        const currentsupply = await packsContract.methods.totalSupply(index).call();
        result.push({
            id: index,
            current: currentsupply,
            max: maxsupply
        });
    }
    return result;
};


export const mintSingle = async (id, qty, wallectAddress) => {
    console.log(id, qty);

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
    console.log(ids, qtys);
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



export {
    getCost
}