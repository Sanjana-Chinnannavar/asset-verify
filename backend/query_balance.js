import { ethers } from "ethers";

const RPC_URL = "https://polygon-amoy.drpc.org";
const ADDRESS = "0x26dc6B6C31E85F82eAD03d1a6d44eB3A31c18A8c";

async function main() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const balance = await provider.getBalance(ADDRESS);
    console.log("Wallet Balance:", ethers.formatEther(balance), "POL");
  } catch (error) {
    console.error("Failed to query balance:", error);
  }
}

main();
