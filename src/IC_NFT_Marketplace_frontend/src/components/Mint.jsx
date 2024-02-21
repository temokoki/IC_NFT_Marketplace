import React, { useState } from "react";
import { useForm } from "react-hook-form";

import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { AUTH_ACTOR } from "../index";
import { USER_NFT_IDs } from "./Gallery";
import Item from "./Item";

export default function Mint(props) {
  const { register, handleSubmit } = useForm();
  const [mintedID, setMintedID] = useState("");

  async function onSubmit(data) {
    props.setLoading(true);
    const name = data.name;
    const imageFile = data.image[0];
    const imageData = await imageFile.arrayBuffer();
    const imageUintArray = [...new Uint8Array(imageData)];

    const newNFT_ID = await AUTH_ACTOR.mintNFT(name, imageUintArray);
    USER_NFT_IDs.unshift(newNFT_ID);
    setMintedID(newNFT_ID);
    props.setLoading(false);
  }

  return (
    <Paper elevation={3}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginBottom: "150px",
        marginTop: { xs: "20px", sm: "50px", md: "70px" },
        marginX: { xs: 2, sm: 16, md: 20, lg: "30%", xl: "35%" },
        paddingX: { xs: 2, sm: 4, md: 8 },
        paddingTop: "1%",
        paddingBottom: "4%",
        borderRadius: "8px",
        backgroundColor: "rgba(10, 10, 25, 0.7)", backdropFilter: "blur(5px)"
      }}>
      {mintedID == "" ?
        <>
          <Typography variant="h2" component="div" marginBottom="5%"
            fontSize={{ xs: 55, sm: 60, md: 70, lg: 80 }}
            sx={{ textShadow: "2px 2px 2px rgba(0, 0, 0, 0.2), -2px -2px 2px rgba(0, 0, 0, 0.2)" }}
          >
            Mint NFT
          </Typography>
          <form>
            <Stack spacing={2} paddingY={0} paddingX={{ xs: 0, sm: 2, md: 8 }}>
              <Typography variant="h6">
                Image
              </Typography>
              <TextField
                {...register("image", { required: true })}
                variant="outlined"
                type="file"
                accept="image/x-png,image/jpeg,image/gif,image/svg+xml,image/webp"
              />
              <Typography variant="h6">
                Name
              </Typography >
              <TextField
                {...register("name", { required: true })}
                variant="outlined"
                type="text"
              />
              <Button variant="contained" size="large" onClick={handleSubmit(onSubmit)}>Mint NFT</Button>
            </Stack>
          </form>
        </>
        :
        <>
          <Typography variant="h2" component="div" marginBottom="2%"
            fontSize={{ xs: 55, sm: 60, md: 70, lg: 80 }}
            sx={{ textShadow: "2px 2px 2px rgba(0, 0, 0, 0.2), -2px -2px 2px rgba(0, 0, 0, 0.2)" }}
          >
            Minted!
          </Typography>
          <Box textAlign="center" maxWidth="350px" spacing={2} paddingY={0} paddingX={{ xs: 0, sm: 2, md: 8 }}>
            <Item ID={mintedID} displayPlace="Minted Preview" />
            <Button variant="contained" color="primary" size="large" sx={{ marginTop: "10px" }} endIcon={<CloseIcon />} onClick={() => setMintedID("")}>Close Preview</Button>
          </Box>
        </>
      }
    </Paper >
  );
}