import hre from "hardhat";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const AssetVerifier = await hre.ethers.getContractFactory("AssetVerifier");
  const verifier = await AssetVerifier.deploy();

  await verifier.waitForDeployment();

  const address = await verifier.getAddress();
  console.log(`AssetVerifier deployed to: ${address}`);

  const dir = __dirname + "/../../frontend/src/contracts";
  
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(
    dir + "/contract-address.json",
    JSON.stringify({ AssetVerifier: address }, undefined, 2)
  );

  const artifact = await hre.artifacts.readArtifact("AssetVerifier");
  fs.writeFileSync(
    dir + "/AssetVerifier.json",
    JSON.stringify(artifact, null, 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
