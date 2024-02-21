import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link, Routes, Route } from "react-router-dom";
import { AUTH_BALANCE, AUTH_PRINCIPAL, HANDLEAUTH } from "../index";

import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';

import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import HomeIcon from '@mui/icons-material/Home';
import MarketplaceIcon from '@mui/icons-material/Storefront';
import AddIcon from '@mui/icons-material/AddCircleOutline';
import MemoryIcon from '@mui/icons-material/Memory';

import Mint from "./Mint";
import Gallery from "./Gallery";

export default function Header(props) {
  const [balance, setBalance] = useState(AUTH_BALANCE);
  useEffect(() => { setBalance(AUTH_BALANCE) }, [AUTH_PRINCIPAL]);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (AUTH_PRINCIPAL.length <= 0 && (location.pathname == "/mynfts" || location.pathname == "/mint"))
      navigate("/");
  }, [navigate, AUTH_PRINCIPAL]);

  return (
    <>
      <AppBar position="sticky" sx={{ alignItems: { xs: "left", sm: "center", backgroundColor: "rgba(10, 10, 25, 0.8)" }, backdropFilter: "blur(10px)" }}>
        <Stack
          divider={<Divider orientation="vertical" flexItem />}
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 0.3, sm: 1 }}
          padding={{ xs: 1, sm: 2 }}
          useFlexGap flexWrap="wrap"
        >
          <Link to="/">
            <Button sx={{ width: "100%" }} size="large" variant="outlined" startIcon={<HomeIcon />}>Home</Button>
          </Link>
          <Link to="/marketplace">
            <Button sx={{ width: "100%" }} size="large" variant="outlined" startIcon={<MarketplaceIcon />}>Marketplace</Button>
          </Link>
          {AUTH_PRINCIPAL.length > 0 &&
            <Link to="/mint">
              <Button sx={{ width: "100%" }} size="large" variant="outlined" startIcon={<AddIcon />}>Mint NFT</Button>
            </Link>
          }
          {AUTH_PRINCIPAL.length > 0 &&
            <Link to="/mynfts">
              <Button sx={{ width: "100%" }} size="large" variant="outlined" startIcon={<MemoryIcon />}>My NFTs</Button>
            </Link>
          }
          {AUTH_PRINCIPAL.length <= 0 &&
            <Button
              onClick={HANDLEAUTH}
              variant="outlined"
              startIcon={<LoginIcon />}
              size="large"
            >
              Login
            </Button>
          }
        </Stack>
        {AUTH_PRINCIPAL.length > 0 &&
          < Box style={{ margin: "-5px 8px 15px", padding: "8px", fontSize: 16, backgroundColor: "rgba(0, 0, 0, 0.2)", borderRadius: "8px" }}>
            ID:
            <span style={{ margin: "0px 10px", fontWeight: "bold" }}>{AUTH_PRINCIPAL}</span>
            |&nbsp;&nbsp;Balance:
            <span style={{ margin: "0px 10px", fontWeight: "bold", color: "lightgreen" }}>{balance.toString()} TKN</span>
            <Button
              onClick={HANDLEAUTH}
              variant="outlined"
              startIcon={<LogoutIcon />}
              size="large"
            >
              Logout
            </Button>
          </Box>
        }
      </AppBar >
      <Routes>
        <Route path="/" />
        <Route path="/marketplace" element={<Gallery setLoading={props.setLoading} title="Marketplace" onBuy={currentBalance => setBalance(currentBalance)} />} />
        <Route path="/mint" element={<Mint setLoading={props.setLoading} />} />
        <Route path="/mynfts" element={<Gallery setLoading={props.setLoading} title="My NFTs" />} />
      </Routes>
    </>
  );
}