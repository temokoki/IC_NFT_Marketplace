import React, { useState, useEffect } from "react";
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import Header from "./Header";
import Footer from "./Footer";
import { useState } from 'react';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export default function App(props) {
  const [isLoading, setLoading] = useState(props.isLoading);

  useEffect(() => setLoading(props.isLoading), [props.isLoading]);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {isLoading &&
        <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={true}>
          <CircularProgress color="inherit" size="10rem" thickness={3} />
        </Backdrop>
      }
      <BrowserRouter >
        <Header setLoading={(isLoading) => setLoading(isLoading)} />
      </BrowserRouter>
      <Footer />
    </ThemeProvider>
  );
}