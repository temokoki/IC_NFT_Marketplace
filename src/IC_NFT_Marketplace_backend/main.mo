import Cycles "mo:base/ExperimentalCycles";
import NFTActorClass "../IC_NFT_backend/nft";
import Principal "mo:base/Principal";
import TrieMap "mo:base/TrieMap";
import List "mo:base/List";
import Iter "mo:base/Iter";
import Bool "mo:base/Bool";

actor NFT_Marketplace {
  //---TOKEN---
  private var balances = TrieMap.TrieMap<Principal, Nat>(Principal.equal, Principal.hash);

  public func initTokens() {
    if (balances.size() <= 0) balances.put(Principal.fromActor(NFT_Marketplace), 100_000_000);
  };

  public query func checkBalance(principal : Principal) : async Nat {
    switch (balances.get(principal)) {
      case null return 0;
      case (?result) return result;
    };
  };

  public query func hasReceivedFreeTokens(principal : Principal) : async Bool {
    switch (balances.get(principal)) {
      case (null) { return false };
      case (?value) { return true };
    };
  };

  public shared ({ caller }) func getFreeTokens() : async Text {
    if (balances.get(caller) == null) {
      return await transferTokens(caller, 100);
    } else {
      return "Already Claimed";
    };
  };

  public shared ({ caller }) func transferTokens(recipientPrincipal : Principal, amount : Nat) : async Text {
    let callerBalance = await checkBalance(caller);
    if (callerBalance >= amount) {
      let newCallerBalance : Nat = callerBalance - amount;
      balances.put(caller, newCallerBalance);

      let recipientBalance = await checkBalance(recipientPrincipal);
      let newRecipientBalance = recipientBalance + amount;
      balances.put(recipientPrincipal, newRecipientBalance);

      return "Success";
    } else {
      return "Insufficient Funds";
    };
  };

  //---MARKET---
  private type Listing = {
    sellerID : Principal;
    price : Nat;
  };

  private var NFTsMap = TrieMap.TrieMap<Principal, NFTActorClass.NFT>(Principal.equal, Principal.hash);
  private var ownersMap = TrieMap.TrieMap<Principal, List.List<Principal>>(Principal.equal, Principal.hash);
  private var listingsMap = TrieMap.TrieMap<Principal, Listing>(Principal.equal, Principal.hash);

  public shared ({ caller }) func mintNFT(name : Text, imgData : [Nat8]) : async Principal {
    Cycles.add(100_500_000_000);
    let newNFT = await NFTActorClass.NFT(caller, name, imgData);

    let newNFTPrincipal = await newNFT.getCanisterID();

    NFTsMap.put(newNFTPrincipal, newNFT);
    addToOwnershipMap(caller, newNFTPrincipal);

    return newNFTPrincipal;
  };

  private func addToOwnershipMap(owner : Principal, nftID : Principal) {
    var ownedNFTs = switch (ownersMap.get(owner)) {
      case null List.nil<Principal>();
      case (?result) result;
    };

    ownedNFTs := List.push(nftID, ownedNFTs);
    ownersMap.put(owner, ownedNFTs);
  };

  private func removeFromOwnershipMap(owner : Principal, nftID : Principal) {
    var ownedNFTs = switch (ownersMap.get(owner)) {
      case null List.nil<Principal>();
      case (?result) result;
    };

    ownedNFTs := List.filter(
      ownedNFTs,
      func(listItemId : Principal) : Bool {
        return listItemId != nftID;
      },
    );
    ownersMap.put(owner, ownedNFTs);
  };

  public query func getOwnedNFTs(user : Principal) : async [Principal] {
    switch (ownersMap.get(user)) {
      case null [];
      case (?result) List.toArray(result);
    };
  };

  public query func getListedNFTs() : async [Principal] {
    let ids = Iter.toArray(listingsMap.keys());
    return ids;
  };

  public shared ({ caller }) func listItem(nftID : Principal, listingPrice : Nat) : async Text {
    var item = switch (NFTsMap.get(nftID)) {
      case null return "Error: NFT doesn't exist!";
      case (?result) result;
    };

    let owner = await item.getOwnerID();

    if (Principal.equal(owner, caller)) {
      let newListing : Listing = {
        sellerID = owner;
        price = listingPrice;
      };

      listingsMap.put(nftID, newListing);
      return "Success";
    } else {
      return "Error: You aren't the owner!";
    };
  };

  public shared ({ caller }) func unlistItem(nftID : Principal) : async Text {
    var item = switch (NFTsMap.get(nftID)) {
      case null return "NFT does not exist.";
      case (?result) result;
    };

    let sellerID = await getSellerID(nftID);

    if (Principal.equal(sellerID, caller)) {
      listingsMap.delete(nftID);

      let transferResult = await item.transferOwnership(caller);
      return transferResult;
    } else {
      return "Error: You aren't the seller!";
    };
  };

  public query func isListed(id : Principal) : async Bool {
    if (listingsMap.get(id) == null) {
      return false;
    } else {
      return true;
    };
  };

  public query func getSellerID(nftID : Principal) : async Principal {
    switch (listingsMap.get(nftID)) {
      case null return Principal.fromText("");
      case (?result) return result.sellerID;
    };
  };

  public query func getListingPrice(nftID : Principal) : async Nat {
    switch (listingsMap.get(nftID)) {
      case null return 0;
      case (?result) result.price;
    };
  };

  public shared ({ caller }) func buyNFT(nftID : Principal) : async Text {
    var item = switch (NFTsMap.get(nftID)) {
      case null return "NFT does not exist";
      case (?result) result;
    };

    let callerBalance = await checkBalance(caller);
    let nftPrice = await getListingPrice(nftID);

    if (callerBalance >= nftPrice) {
      //Transfer tokens from caller to NFT seller
      let newCallerBalance : Nat = callerBalance - nftPrice;
      balances.put(caller, newCallerBalance);

      let sellerID = await getSellerID(nftID);
      let recipientBalance = await checkBalance(sellerID);
      let newRecipientBalance = recipientBalance + nftPrice;
      balances.put(sellerID, newRecipientBalance);

      //Transfer NFT ownership to caller
      let transferResult = await item.transferOwnership(caller);

      if (transferResult == "Success") {
        listingsMap.delete(nftID);
        addToOwnershipMap(caller, nftID);
        removeFromOwnershipMap(sellerID, nftID);
      };
      return "Success";
    } else {
      return "Insufficient Funds";
    };
  };

  //---Common---
  private stable var balanceEntries : [(Principal, Nat)] = [];
  private stable var NFTEntries : [(Principal, NFTActorClass.NFT)] = [];
  private stable var NFTOwnersEntries : [(Principal, List.List<Principal>)] = [];
  private stable var NFTListingEntries : [(Principal, Listing)] = [];

  system func preupgrade() {
    balanceEntries := Iter.toArray(balances.entries());
    NFTEntries := Iter.toArray(NFTsMap.entries());
    NFTOwnersEntries := Iter.toArray(ownersMap.entries());
    NFTListingEntries := Iter.toArray(listingsMap.entries());
  };

  system func postupgrade() {
    balances := TrieMap.fromEntries<Principal, Nat>(balanceEntries.vals(), Principal.equal, Principal.hash);
    NFTsMap := TrieMap.fromEntries<Principal, NFTActorClass.NFT>(NFTEntries.vals(), Principal.equal, Principal.hash);
    ownersMap := TrieMap.fromEntries<Principal, List.List<Principal>>(NFTOwnersEntries.vals(), Principal.equal, Principal.hash);
    listingsMap := TrieMap.fromEntries<Principal, Listing>(NFTListingEntries.vals(), Principal.equal, Principal.hash);
  };
};
