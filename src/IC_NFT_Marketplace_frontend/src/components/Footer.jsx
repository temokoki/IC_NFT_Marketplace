import React from "react";
import AppBar from '@mui/material/AppBar';
import Typography from '@mui/material/Typography';

export default function Footer() {
  return (
    <AppBar position="fixed" sx={{ top: 'auto', bottom: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(10, 10, 25, 0.7)", backdropFilter: "blur(20px)" }}>
      <Typography variant="overline" component="div" sx={{ pt: 1, mb: "-10px" }} fontSize={{ xs: 10, sm: 14 }}>
        Simple marketplace for non-fungible tokens
      </Typography>
      <Typography variant="overline" component="div" sx={{ pt: 0, pb: 1 }} fontSize={{ xs: 10, sm: 12 }} >
        Copyright ⓒ{new Date().getFullYear()}
      </Typography>
    </AppBar >
  );
}