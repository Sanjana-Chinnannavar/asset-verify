import { ethers } from "ethers";
const privateKey = "ff8c7e6ad120be4b93cc089ac7b204b9e1af24b2ce0e7f59f6f81328d2088b5b";
const wallet = new ethers.Wallet(privateKey);
console.log("Wallet address:", wallet.address);
