import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import NFTList from '../components/NFTList';
import toast, { Toaster } from 'react-hot-toast';
import {
    connectWallet,
    getCurrentWalletConnected,
    getPackNfts,
    burnToMint,
    decryptArrayValues,
    getCardsNfts
} from '../utils/interact';
import { useRouter } from 'next/navigation';


const NFTPage = () => {
    const router = useRouter();


    const [activeTab, setActiveTab] = useState('tab1');
    const [nftsTab1, setNFTsTab1] = useState([]);
    const [nftsTab2, setNFTsTab2] = useState([]);
    const [burnOption, setBurnOption] = useState({ids: [], quantity: []});
    const [walletAddress, setWalletAddress] = useState("");
    const [loading, setLoading] = useState(true);


    const activeNFTs = activeTab === 'tab1' ? nftsTab1 : nftsTab2;

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

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const getUserData = async () => {
        if(walletAddress.length > 0){
            setLoading(true);

            setNFTsTab1(await getPackNfts(walletAddress));
            setNFTsTab2(await getCardsNfts(walletAddress));

            setLoading(false);
        }
    };

    useEffect(() => {
        getUserData();   
    },[walletAddress])

    const fetchData =  async () => {
        // setLoading(true);
        const { success, status, address } = await getCurrentWalletConnected();
        if(!success){
            router.push('/');
            return;
        }
        setWalletAddress(address);
        // setLoading(false);
    };

    useEffect(() => {
        fetchData();
        addWalletListener();
    }, [])

    const packSelected = (id, balance) => {
        // console.log("id", id);
        if(!walletAddress) return;
        if(burnOption.quantity[burnOption.ids.indexOf(id)] >= balance) return;
        if(burnOption.ids.includes(id)){
            let indexItem = burnOption.ids.indexOf(id);
            let newItem = burnOption.quantity[indexItem];

            burnOption.quantity[indexItem] = Number(newItem) + 1;
            setBurnOption({...burnOption, quantity: burnOption.quantity})
        }else{
            setBurnOption({...burnOption, ids: [...burnOption.ids, id], quantity: [...burnOption.quantity, 1]});
        }
    };

    const removeId = (id) => {
        let indexToRemove = burnOption.ids.indexOf(id);
        burnOption.ids.splice(indexToRemove, 1);
        burnOption.quantity.splice(indexToRemove, 1);
        setBurnOption({...burnOption, ids: burnOption.ids, quantity: burnOption.quantity});
    };

    const burnQuantity = (id) => {
        return (
            burnOption.quantity[burnOption.ids.indexOf(id)] != undefined
            ? burnOption.quantity[burnOption.ids.indexOf(id)] : 0
        )
    };

    const burnNFTs = async () => {
        // console.log("burn option", burnOption);
        if(burnOption.ids.length == 0){
            toast.error("click on packs to burn");
            return;
        }

        const tqty = burnOption.quantity.reduce((a, b) => a + b, 0);
        const amountToMint = tqty * 3;

        const response = await fetch(`/api/reveal?qty=${amountToMint}`);
        if(response.status !==  200){
            toast.error("Failed to generate mint");
            return;
        }

        const data = await response.json();
        const mintOption = decryptArrayValues(data.hash);

        const toastOne = toast.loading(`Burning ${tqty} packs...`);
        const { success, status } = await burnToMint(
            burnOption.ids, burnOption.quantity, mintOption.tokenids, mintOption.qtys, walletAddress
        );
        toast.dismiss(toastOne);
        if(success){

            // console.log("success");
            setBurnOption({ids: [], quantity: []});
            handleTabChange('tab2');
            getUserData();
            toast.success(status);
        }else{
            // console.log("error");

            const responsePost = await fetch('/api/reveal', {
                method: 'POST',
                body: JSON.stringify({
                    ids: mintOption.tokenids,
                    qtys: mintOption.qtys
                }),
                headers: {
                  'Content-type': 'application/json; charset=UTF-8'
              },
            });
      
            const dataPost = await responsePost.json()
            // console.log(dataPost)
            toast.error(status);
        }
    };


  return (
    <>
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

    <div className="container mx-auto py-8">
        <Toaster
          position="top-center"
          reverseOrder={false}
        />
      <div className="flex justify-center mb-4">
        <button
          className={`mr-4 p-2 ${
            activeTab === 'tab1' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}
          onClick={() => handleTabChange('tab1')}
        >
          Packs
        </button>
        <button
          className={`p-2 ${
            activeTab === 'tab2' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}
          onClick={() => handleTabChange('tab2')}
        >
          Cards
        </button>
      </div>
      {activeTab === 'tab1' ? (
        <>
            {loading ? 
                <div className="text-center mt-40">
                    <div role="status">
                        <svg className="inline mr-2 w-10 h-10 text-white-200 animate-spin dark:text-white-600 fill-gray-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                        </svg>
                        <span className="sr-only">Loading...</span>
                    </div>
                </div>
            :
            <>
                {nftsTab1.length > 0 ?
                <>
                    <div className="flex flex-wrap items-center justify-center">
                        {nftsTab1.map((nft) => (
                            <div key={nft.tokenId} className="cursor-pointer flex-shrink-0 m-1 mt-5 relative overflow-hidden border-2 border-gray-700 rounded-lg max-w-xs shadow-lg">
                                <div className="pt-5 px-5" onClick={ () => packSelected(nft.tokenId, nft.balance)}>
                                <img className="w-60 h-60" src={nft.img} alt=""/>
                                </div>
                                <div className="relative text-white px-6 pb-6 mt-6">
                                <span className="block opacity-75 -mb-1">{nft.name}</span>
                                <div className="flex justify-between">
                                    <span className="block font-semibold text-xl">Qty {nft.balance}</span>
                                    {burnQuantity(nft.tokenId) > 0 &&
                                        <span className="block bg-white rounded-full text-purple-500 text-xs font-bold px-3 py-2 leading-none flex items-center">
                                            <h5>Burn {burnQuantity(nft.tokenId)}</h5>
                                            <div onClick={() => removeId(nft.tokenId)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-slate-500 hover:text-slate-700 hover:cursor-pointer">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>                      
                                            </div>
                                        </span>
                                    }
                                </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className='flex items-center justify-center mt-10'>
                        <section className="text-center mx-6 lg:w-2/3">
                            <div>
                                <button onClick={() => burnNFTs()} className="mt-5 border-solid border-2 border-gray-700 font-semibold rounded-lg p-2 px-4 text-white">Burn</button>
                            </div>
                        </section>
                    </div>
                </>
                : 
                    <span className="block text-white font-semibold text-xl text-center mt-32">empty packs, mint some packs.</span>
                }
            </>
            }
        </>
      ) : (
        <>
            {nftsTab2.length > 0 ? 
                <div className="flex flex-wrap items-center justify-center">
                    {nftsTab2.map((nft) => (
                        <div key={nft.tokenId} className="cursor-pointer flex-shrink-0 m-1 mt-5 relative overflow-hidden border-2 border-gray-700 rounded-lg max-w-xs shadow-lg">
                            <div className="pt-5 px-5" onClick={ () => packSelected(nft.tokenId, nft.balance)}>
                            <img className="w-62 h-60" src={nft.img} alt=""/>
                            </div>
                            <div className="relative text-white px-6 pb-6 mt-6">
                            <span className="block opacity-75 -mb-1">{nft.name}</span>
                            <div className="flex justify-between">
                                <span className="block font-semibold text-xl">Qty {nft.balance}</span>
                            </div>
                            </div>
                        </div>
                    ))}
                </div>
            :
                <span className="block text-white font-semibold text-xl text-center mt-32">empty cards, brun some packs.</span>
            }
        </>
      )}
    </div>
    </>
  );
};

export default NFTPage;
