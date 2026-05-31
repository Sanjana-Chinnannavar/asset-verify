import { ethers } from "ethers";

const RPC_URL = "https://polygon-amoy.drpc.org";
const CONTRACT_ADDRESS = "0x6Ae4413f95D93D98Ebf4673a47e00C0EF635889D";
const ABI = ["function owner() view returns (address)"];

async function main() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    const owner = await contract.owner();
    console.log("On-chain contract owner:", owner);
  } catch (error) {
    console.error("Failed to query owner:", error);
  }
}

main();
