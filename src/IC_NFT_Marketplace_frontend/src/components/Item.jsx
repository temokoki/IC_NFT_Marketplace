import React, { useEffect, useState } from "react";
import { Principal } from "@dfinity/principal";
import { Actor } from '@dfinity/agent';
import { canisterId as marketPlace_ID, IC_NFT_Marketplace_backend } from "../../../declarations/IC_NFT_Marketplace_backend";
import { HTTP_AGENT, AUTH_PRINCIPAL, AUTH_ACTOR, AUTH_BALANCE } from "../index";
import { LISTED_NFT_IDs, USER_NFT_IDs } from "./Gallery";

import Box from '@mui/system/Box';
import Grid from '@mui/material/Grid';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';


const idlFactory_NFT = ({ IDL }) => {
  const NFT = IDL.Service({
    'getName': IDL.Func([], [IDL.Text], ['query']),
    'getOwnerID': IDL.Func([], [IDL.Principal], ['query']),
    'getImageData': IDL.Func([], [IDL.Vec(IDL.Nat8)], ['query']),
    'getCanisterID': IDL.Func([], [IDL.Principal], ['query']),
    'transferOwnership': IDL.Func([IDL.Principal], [IDL.Text], []),
  });
  return NFT;
};

export default function Item(props) {
  const [name, setName] = useState();
  const [owner, setOwner] = useState();
  const [image, setImage] = useState();
  const [actionItem, setActionItem] = useState();
  const [priceInput, setPriceInput] = useState();
  const [listedStyle, setListedStyle] = useState();
  const [priceLabel, setPriceLabel] = useState();
  const [shouldDisplay, setDisplay] = useState(true);

  const NFTActor = Actor.createActor(idlFactory_NFT, {
    agent: HTTP_AGENT,
    canisterId: props.ID,
  });

  async function fetchNFTData() {
    const name = await NFTActor.getName();
    setName(name);

    const receivedImageData = await NFTActor.getImageData();
    const imageUintArray = new Uint8Array(receivedImageData);
    const imageURL = URL.createObjectURL(
      new Blob([imageUintArray.buffer], { type: "image/png" })
    );
    setImage(imageURL);
  }

  useEffect(() => { fetchNFTData() }, []);

  async function updateVisuals() {
    setOwner();
    setListedStyle();
    setPriceLabel();
    setActionItem();

    if (props.displayPlace == "Marketplace") {
      const listingPrice = await IC_NFT_Marketplace_backend.getListingPrice(props.ID);
      const sellerID = (await IC_NFT_Marketplace_backend.getSellerID(props.ID)).toString();
      setOwner(sellerID);

      if (sellerID == AUTH_PRINCIPAL) {
        setOwner("You");
        setActionItem(<Button variant="outlined" onClick={unlistItem}>Unlist</Button>);
      } else if (AUTH_PRINCIPAL.length > 0) {
        setActionItem(<Button variant="outlined" onClick={() => handleBuy(listingPrice)}>Buy</Button>);
      }

      setPriceLabel(<Paper variant="outlined" sx={{ border: 0, borderRadius: 0, padding: "2px 15px" }}>
        Price: {listingPrice.toString()} <Typography variant="caption" color="primary">TKN</Typography></Paper>);
    } else if (props.displayPlace == "My NFTs") {
      const isListed = await IC_NFT_Marketplace_backend.isListed(props.ID);

      if (isListed) {
        const listingPrice = await IC_NFT_Marketplace_backend.getListingPrice(props.ID);
        setListedStyle({ filter: "blur(1.3px) grayscale(70%)" });
        setActionItem(<>
          <Box sx={{ padding: "5px", border: "1px solid gray", borderRadius: "4px", color: "GrayText" }}>
            Listed: {listingPrice.toString()}
            <Typography variant="caption" >&nbsp;TKN</Typography>
          </Box>
          <Button variant="outlined" onClick={unlistItem}>Unlist</Button>
        </>);
      } else {
        setActionItem(<Button variant="outlined" onClick={handleSell}>Sell</Button>);
      }
      setDisplay(true);
    }
  }

  useEffect(() => { updateVisuals() }, [props.displayPlace, AUTH_PRINCIPAL]);

  let sellingPrice;
  function handleSell() {
    setPriceInput(
      <TextField
        size="small"
        variant="outlined"
        type="number"
        label="Price in TKN"
        InputLabelProps={{ shrink: true }}
        value={sellingPrice}
        onChange={(e) => (sellingPrice = e.target.value)}
      />
    );
    setActionItem(<Button variant="outlined" onClick={listItem}>Confirm</Button>);
  }

  async function listItem() {
    if (sellingPrice == undefined || sellingPrice <= 0)
      return;

    props.setLoading(true);
    setListedStyle({ filter: "blur(1.3px) grayscale(70%)" });

    const listingResult = await AUTH_ACTOR.listItem(props.ID, Number(sellingPrice));

    if (listingResult == "Success") {
      const transferResult = await NFTActor.transferOwnership(Principal.fromText(marketPlace_ID));

      if (transferResult == "Success") {
        LISTED_NFT_IDs.unshift(props.ID);
        setPriceInput();
        setActionItem(<>
          <Box sx={{ padding: "5px", border: "1px solid gray", borderRadius: "4px", color: "GrayText" }}>
            Listed: {sellingPrice}
            <Typography variant="caption" >&nbsp;TKN</Typography>
          </Box>
          <Button variant="outlined" onClick={unlistItem}>Unlist</Button>
        </>);
      }
      else alert(transferResult)
    }
    else alert(listingResult)

    props.setLoading(false);
  }

  async function unlistItem() {
    props.setLoading(true);
    const unlistResult = await AUTH_ACTOR.unlistItem(props.ID);

    if (unlistResult == "Success") {
      LISTED_NFT_IDs = LISTED_NFT_IDs.filter((ID) => ID !== props.ID);
      if (props.displayPlace == "Marketplace") setDisplay(false);
      setListedStyle();
      setListedStyle();
      setActionItem(<Button variant="outlined" onClick={handleSell}>Sell</Button>);
    }
    else alert(unlistResult)

    props.setLoading(false);
  }

  async function handleBuy(listingPrice) {
    props.setLoading(true);

    const buyResult = await AUTH_ACTOR.buyNFT(props.ID);

    if (buyResult == "Success") {
      USER_NFT_IDs.unshift(props.ID);
      LISTED_NFT_IDs = LISTED_NFT_IDs.filter((ID) => ID !== props.ID);
      AUTH_BALANCE -= listingPrice;
      props.onBuy(AUTH_BALANCE);
      setDisplay(false);
    }
    else alert(buyResult);

    props.setLoading(false);
  }

  return (
    <Grid item xs={12} sm={6} lg={8} style={{
      maxWidth: "300px", display: shouldDisplay ? "inline" : "none"
    }}>
      <Card elevation={4}>
        <CardMedia
          component="img"
          alt={name}
          image={image}
          style={listedStyle}
        />
        {priceLabel}
        <CardContent>
          <Typography variant="h5" component="div">
            {name}
          </Typography>
          {owner != undefined &&
            <Typography variant="body2" color="text.secondary">
              Owner: {owner}
            </Typography>
          }
        </CardContent>
        {actionItem != undefined &&
          <CardActions>
            {priceInput}
            {actionItem}
          </CardActions>
        }
      </Card>
    </Grid >);
}