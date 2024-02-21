import React from "react";
import { createRoot } from 'react-dom/client'
import { HttpAgent, Actor } from '@dfinity/agent';
import fetch from 'isomorphic-fetch';
import { AuthClient } from "@dfinity/auth-client";
import { canisterId, idlFactory } from "../../declarations/IC_NFT_Marketplace_backend";
import App from "./components/App";

const host = process.env.DFX_NETWORK === 'local' ? 'http://127.0.0.1:4943' : 'https://icp-api.io';
export const HTTP_AGENT = new HttpAgent({ fetch, host });

export let AUTH_PRINCIPAL = "";
export let AUTH_BALANCE = 0;
export let AUTH_ACTOR;

let authClient;
const root = createRoot(document.getElementById("root"));

async function init() {
  if (process.env.DFX_NETWORK === "local")
    await HTTP_AGENT.fetchRootKey();

  authClient = await AuthClient.create();

  if (await authClient.isAuthenticated())
    handleAuthenticated();
  else
    root.render(<App />);
};

init();

async function handleAuthenticated() {
  root.render(<App isLoading={true} />);
  try {
    const identity = await authClient.getIdentity();
    const principal = await identity.getPrincipal();

    HTTP_AGENT.replaceIdentity(identity);

    AUTH_ACTOR = await Actor.createActor(idlFactory, {
      agent: HTTP_AGENT,
      canisterId: canisterId,
    });

    if (await AUTH_ACTOR.hasReceivedFreeTokens(principal) == false)
      await AUTH_ACTOR.getFreeTokens();

    AUTH_BALANCE = await AUTH_ACTOR.checkBalance(principal);
    AUTH_PRINCIPAL = principal.toString();
  } catch (error) {
    logout();
  }
  root.render(<App isLoading={false} />);
}

async function logout() {
  root.render(<App isLoading={true} />);

  await authClient.logout();
  const identity = await authClient.getIdentity();
  HTTP_AGENT.replaceIdentity(identity);
  AUTH_PRINCIPAL = "";

  root.render(<App isLoading={false} />);
}

export const HANDLEAUTH = async () => {
  if (await authClient.isAuthenticated()) {
    logout();
  } else {
    await authClient.login({
      identityProvider: process.env.DFX_NETWORK === "local"
        ? `http://${process.env.INTERNET_IDENTITY_CANISTER_ID}.localhost:4943/`  //For Chrome and Firefox
        // `http://localhost:4943/?canisterId=${process.env.INTERNET_IDENTITY_CANISTER_ID}`  //For Safari
        : "https://identity.ic0.app",
      onSuccess: () => handleAuthenticated(),
    });
  }
}