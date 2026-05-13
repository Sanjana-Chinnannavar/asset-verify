// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AssetVerifier is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    event AssetRegistered(uint256 indexed tokenId, address owner, string tokenURI);

    constructor() ERC721("AssetVerifier", "AVRF") Ownable(msg.sender) {}

    /**
     * @dev Mints a new asset NFT and assigns it to an address.
     * @param to The address of the new owner.
     * @param uri The IPFS URI containing the asset's metadata.
     * @return uint256 The new token ID.
     */
    function registerAsset(address to, string memory uri) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit AssetRegistered(tokenId, to, uri);
        
        return tokenId;
    }
}
