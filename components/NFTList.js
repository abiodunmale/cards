import React, { useState } from 'react';


const NFTList = ({ nfts, handleBurn }) => {
  const [mintOption, setMintOption] = useState({ids: [], quantity: []});
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (event) => {
    setQuantity(event.target.value);
  };

  const packSelected = (id) => {
    if(!handleBurn) return;

    console.log("id", id);
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

  return (
    <div className="flex flex-wrap items-center justify-center">
      {nfts.map((nft) => (

          <div key={nft.id} className="cursor-pointer flex-shrink-0 m-1 mt-5 relative overflow-hidden border-2 border-gray-700 rounded-lg max-w-xs shadow-lg">
            <div className="pt-5 px-5" onClick={ () => packSelected(nft.id)}>
              <img  src="/images/pack.png" alt=""/>
            </div>
            <div className="relative text-white px-6 pb-6 mt-6">
              <span className="block opacity-75 -mb-1">Pokemon</span>
              <div className="flex justify-between">
                <span className="block font-semibold text-xl">Qty 1</span>
                {true &&
                  <span className="block bg-white rounded-full text-purple-500 text-xs font-bold px-3 py-2 leading-none flex items-center">
                    <h5>Burn {1}</h5>
                    <div>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-slate-500 hover:text-slate-700 hover:cursor-pointer">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>                      
                    </div>
                  </span>
                }
              </div>
            </div>
          </div>
        // <div key={nft.id} className="bg-white rounded-md shadow-md p-4">
        //   {/* Display NFT details */}
        //   <h3 className="text-xl font-bold">{nft.title}</h3>
        //   <p className="text-gray-500">{nft.description}</p>
        //   {/* Additional NFT information */}
        //   <p className="text-gray-700 mt-2">Owner: {nft.owner}</p>
        //   {/* Show burn form for Tab 1 */}
        //   {handleBurn && (
        //     <div className="mt-4">
        //       <label htmlFor={`quantity-${nft.id}`} className="text-gray-700">
        //         Quantity to Burn:
        //       </label>
        //       <div className="flex items-center">
        //         <input
        //           id={`quantity-${nft.id}`}
        //           type="number"
        //           min="1"
        //           value={quantity}
        //           onChange={handleQuantityChange}
        //           className="bg-gray-100 border border-gray-300 rounded-md py-1 px-2 w-16 ml-2 focus:outline-none"
        //         />
        //         <button
        //           className="bg-red-500 text-white py-2 px-4 rounded-md ml-4"
        //           onClick={() => handleBurn(nft.id, quantity)}
        //         >
        //           Burn NFT
        //         </button>
        //       </div>
        //     </div>
        //   )}
        // </div>
      ))}
    </div>
  );
};

export default NFTList;
