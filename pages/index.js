import React , { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link';
import { createHmac } from 'crypto';

import {
  connectWallet,
  getCurrentWalletConnected,
  getCost,
  getPackSupply,
  mintSingle,
  mintMutiple,
  getMintState,
  mintAvailableTokensForUser,
  mintWhitelist,
  decryptArrayValues,
  encryptArrayValues
} from '../utils/interact';

const SECRET_KEY = 'YOUR_SECRET_KEY';


export default function Home() {

  const [mintOption, setMintOption] = useState({ids: [], quantity: []});
  const [walletAddress, setWalletAddress] = useState("");
  const [mintCost, setMintCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [packSupply, setPackSupply] = useState([]);
  const [mintState, setMintState] = useState(false);



  const truncate = (address) => {
    return String(address).substring(0, 6) +"..." +String(address).substring(38);
  };


  const addWalletListener = () => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", async (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress("");
        }
      });
    }
  };


  const connectWalletPressed = async () => {
    const {address, status, success} = await connectWallet();
    setWalletAddress(address);
  }

  const fetchData =  async () => {
    setLoading(true);
    const { success, status, address } = await getCurrentWalletConnected();
    setWalletAddress(address);
    setMintCost(await getCost());
    setPackSupply(await getPackSupply());
    setMintState(await getMintState());
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    addWalletListener();
  }, [])



  const mintQuantity = (id) => {
    return (
      mintOption.quantity[mintOption.ids.indexOf(id)] != undefined
      ? mintOption.quantity[mintOption.ids.indexOf(id)] : 0
    )
  };

  const packSelected = (id) => {
    // console.log("id", mintOption.ids.indexOf(id));
    if(!walletAddress) return;
    if(mintOption.ids.includes(id)){
      let indexItem = mintOption.ids.indexOf(id);
      let newItem = mintOption.quantity[indexItem];

      mintOption.quantity[indexItem] = Number(newItem) + 1;
      setMintOption({...mintOption, quantity: mintOption.quantity})
    }else{
      setMintOption({...mintOption, ids: [...mintOption.ids, id], quantity: [...mintOption.quantity, 1]});
    }

  };

  const removeId = (id) => {
    let indexToRemove = mintOption.ids.indexOf(id);
    mintOption.ids.splice(indexToRemove, 1);
    mintOption.quantity.splice(indexToRemove, 1);
    setMintOption({...mintOption, ids: mintOption.ids, quantity: mintOption.quantity});
  };  

  const mintBtnPressed = async () => {
    // console.log("mintOption");
    // console.log(mintOption);
    if(mintOption.ids.length == 0){
      toast.error("click on cards to select pack to mint");
      return;
    }

    const toastTwo = toast.loading(`Minting ${getTotalQty()} packs...`);
    if(mintOption.ids.length > 1){
      const {success, status} = await mintMutiple(mintOption.ids, mintOption.quantity, walletAddress);
      toast.dismiss(toastTwo);
      if(success){
        setPackSupply(await getPackSupply());
        setMintOption({ids: [], quantity: []});
        toast.success(status);
      }else{
        toast.error(status);
      }
    }else{
      const {success, status} = await mintSingle(mintOption.ids[0], mintOption.quantity[0], walletAddress);
      toast.dismiss(toastTwo);
      if(success){
        setPackSupply(await getPackSupply());
        setMintOption({ids: [], quantity: []});
        toast.success(status);
      }else{
        toast.error(status);
      }
    }
  };

  const currentSupplyPack = (id) => {
    let arr = packSupply.find(item => item.id === id);
    return (
      !arr ? "loading..." : arr.current +" / "+ arr.max
    );
  };

  const getTotalQty = () => mintOption.quantity.reduce((a, b) => a + b, 0);

  const handleGenerateMintIds = async () => {

    // await new Promise(resolve => setTimeout(resolve, 3000));

    const response = await fetch(`/api/reveal?qty=3`);
    if (response.ok) {
      const data = await response.json();
      // console.log("data", data);

      const decrypted = decryptArrayValues(data.hash);
      // console.log("Decrypted number:", decrypted);

      await new Promise(resolve => setTimeout(resolve, 7000));

      const responsePost = await fetch('/api/reveal', {
          method: 'POST',
          body: JSON.stringify({
              ids: decrypted.tokenids,
              qtys: decrypted.qtys
          }),
          headers: {
            'Content-type': 'application/json; charset=UTF-8'
        },
      });

      const dataPost = await responsePost.json()

      // console.log(dataPost)

    } else {
      console.error('Failed to generate mint IDs');
    }
  };

  return (
    <div className="items-center justify-center w-full h-screen">
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>


      <header className="bg-gray-800 text-white py-4 px-8">
        <nav>
          <ul className="flex space-x-4 float-right">
            <li>
              <Link href="/" className="hover:text-gray-300">
                Home
              </Link>
            </li>
            <li>
              <Link href="/nft" className="hover:text-gray-300">
                NFTs
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      <main className='flex flex-col w-full h-screen'>

        <Toaster
          position="top-center"
          reverseOrder={false}
        />

        {/* <div className='text-center pt-10'>
          <h1 className="font-bold text-2xl text-gray-100 ">select packs</h1>
        </div> */}

        <div className="flex flex-wrap items-center justify-center pt-10">

          <div  className="cursor-pointer flex-shrink-0 m-1 mt-5 relative overflow-hidden border-2 border-gray-700 rounded-lg max-w-xs shadow-lg">
            <div className="pt-5 px-5" onClick={ () => packSelected(1)}>
              <img className="w-52 h-52" src="/images/pack.png" alt=""/>
            </div>
            <div className="relative text-white px-6 pb-6 mt-6">
              <span className="block opacity-75 -mb-1">Pokemon</span>
              <div className="flex justify-between">
                <span className="block font-semibold text-xl">{currentSupplyPack(1)}</span>
                {mintQuantity(1) > 0 &&
                  <span className="block bg-white rounded-full text-purple-500 text-xs font-bold px-3 py-2 leading-none flex items-center">
                    <h5>{mintQuantity(1)}</h5>
                    <div onClick={() => removeId(1)}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-slate-500 hover:text-slate-700 hover:cursor-pointer">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>                      
                    </div>
                  </span>
                }
              </div>
            </div>
          </div>

          <div  className="cursor-pointer flex-shrink-0 m-1 relative overflow-hidden border-2 border-gray-700 rounded-lg max-w-xs shadow-lg">
            <div className="pt-5 px-5" onClick={ () => packSelected(2)}>
              <img className="w-52 h-52" src="/images/pack.png" alt=""/>
            </div>
            <div className="relative text-white px-6 pb-6 mt-6">
              <span className="block opacity-75 -mb-1">Pokemon</span>
              <div className="flex justify-between">
                <span className="block font-semibold text-xl">{currentSupplyPack(2)}</span>
                {mintQuantity(2) > 0 &&
                  <span className="block bg-white rounded-full text-purple-500 text-xs font-bold px-3 py-2 leading-none flex items-center">
                    <h5>{mintQuantity(2)}</h5>
                    <div onClick={() => removeId(2)}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-slate-500 hover:text-slate-700 hover:cursor-pointer">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>                      
                    </div>
                  </span>
                }
              </div>
            </div>
          </div>

          <div className="cursor-pointer flex-shrink-0 m-1 mt-5 relative overflow-hidden border-2 border-gray-700 rounded-lg max-w-xs shadow-lg">
            <div className="pt-5 px-5"  onClick={ () => packSelected(3)}>
              <img className="w-52 h-52" src="/images/pack.png" alt=""/>
            </div>
            <div className="relative text-white px-6 pb-6 mt-6">
              <span className="block opacity-75 -mb-1">Pokemon</span>
              <div className="flex justify-between">
                <span className="block font-semibold text-xl">{currentSupplyPack(3)}</span>
                {mintQuantity(3) > 0 &&
                  <span className="block bg-white rounded-full text-purple-500 text-xs font-bold px-3 py-2 leading-none flex items-center">
                    <h5>{mintQuantity(3)}</h5>
                    <div onClick={() => removeId(3)}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-slate-500 hover:text-slate-700 hover:cursor-pointer">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>                      
                    </div>
                  </span>
                }
              </div>
            </div>
          </div>

        </div>

        <div className='flex items-center justify-center mt-10'>
          <section className="text-center mx-6 lg:w-2/3">
            <div>

              <p className="text-lg leading-6 font-semibold text-gray-100">Each Packs Cost {mintCost} Ξ</p>

              {walletAddress.length > 0 ?
                <>
                  <p className="text-sm mt-5 leading-6 font-semibold text-gray-100">{mintState ? "SELECT PACKS TO MINT" : "SALE IS NOT ACTIVE"}</p>
                  <button disabled={!mintState} onClick={mintBtnPressed}  className="mt-5 border-solid border-2 border-gray-700 font-semibold rounded-lg p-2 px-4 text-white">
                    Mint
                    {mintOption.ids.length > 0 && <>
                      {""}  {getTotalQty()} @ {parseFloat(getTotalQty() * Number(mintCost)).toFixed(5)}Ξ
                    </> }
                  </button>

                {/* <button onClick={() => handleGenerateMintIds()}  className="mt-5 border-solid border-2 border-gray-700 font-semibold rounded-lg p-2 px-4 text-white">Doings</button> */}

                </>
              :
                <button onClick={connectWalletPressed}  className="mt-5 border-solid border-2 border-gray-700 font-semibold rounded-lg p-2 px-4 text-white">Connect Wallet</button>
              }
            </div>
          </section>
        </div> 

      </main>
    </div>
  )
}
