import Principal "mo:base/Principal";

actor class NFT(initialOwnerID : Principal, name : Text, imageData : [Nat8]) = this {

  private var currentOwnerID = initialOwnerID;

  public query func getOwnerID() : async Principal {
    return currentOwnerID;
  };

  public query func getName() : async Text {
    return name;
  };

  public query func getImageData() : async [Nat8] {
    return imageData;
  };

  public query func getCanisterID() : async Principal {
    return Principal.fromActor(this);
  };

  public shared ({ caller }) func transferOwnership(newOwner : Principal) : async Text {
    if (Principal.equal(caller, currentOwnerID)) {
      currentOwnerID := newOwner;
      return "Success";
    } else {
      return "Error: You aren't the owner!";
    };
  };
};
