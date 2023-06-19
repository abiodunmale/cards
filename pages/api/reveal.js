import fs from 'fs';
import path from 'path';
import { encryptArrayValues } from '../../utils/interact';

const filePath = path.resolve(process.cwd(), 'utils', 'tokenMgt.json');

// Function to read the data from the JSON file
function readDataFromFile() {
    try {
      const jsonData = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(jsonData);
    } catch (error) {
      console.error('Error reading data from file:', error);
      return [];
    }
}

// Function to write the updated data to the JSON file
function writeDataToFile(data) {
    try {
      const jsonData = JSON.stringify(data, null, 2);
      fs.writeFileSync(filePath, jsonData, 'utf-8');
    } catch (error) {
      console.error('Error writing data to file:', error);
    }
}

function generateArrays(inputArray) {
    const uniqueArray = [...new Set(inputArray)];
    const occurrenceArray = uniqueArray.map((element) =>
      inputArray.filter((value) => value === element).length
    );
  
    return [uniqueArray, occurrenceArray];
}

// Function to generate random mint IDs with occasional changes based on the current timestamp
async function generateRandomMintIds(qty) {
    let someData = readDataFromFile();

    const mintIds = [];
    const availableTokenIds = someData
        .filter((tokenData) => tokenData.quantity > 0)
        .map((tokenData) => tokenData.tokenId);

    while (mintIds.length < qty && availableTokenIds.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableTokenIds.length);
        const tokenId = availableTokenIds[randomIndex];
        const tokenData = someData.find((data) => data.tokenId === tokenId);

        mintIds.push(tokenId);
        tokenData.quantity--;

        if (tokenData.quantity === 0) {
            const indexToRemove = availableTokenIds.indexOf(tokenId);
            availableTokenIds.splice(indexToRemove, 1);
        }
    }

    if (mintIds.length < qty) {
        return []; // Return an empty array if not enough mint IDs were generated
    }

    writeDataToFile(someData);

    return mintIds;
}


export default async function handler(req, res) {
    const { method, body, query } = req;
    const { qty } = query;

    if (method === 'GET') {

        if(!qty){
            return res.status(500).json({ error: 'qty is required' });
        }
      
        const mintIds = await generateRandomMintIds(Number(qty));

        if (mintIds.length > 0) {
            const [tokenids, qtys] = generateArrays(mintIds);

            const hash =  encryptArrayValues({ tokenids, qtys });

            return res.status(200).json({ hash });
        } else {
            return res.status(500).json({ error: 'Failed to generate mint IDs'});
        }

        
    }else if (method === 'POST') {
        const { ids, qtys } = body;

        let someData = readDataFromFile();

        ids.forEach((tokenId, index) => {
            let quantity = qtys[index];
            let foundToken = someData.find(obj => obj.tokenId === tokenId);
            
            if (foundToken) {
                foundToken.quantity += quantity;
            }
        });

        writeDataToFile(someData);

        return res.status(200).json({ msg: "success" });
    } else {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
}