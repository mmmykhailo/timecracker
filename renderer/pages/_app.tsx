import React from "react";
import type { AppProps } from "next/app";
import "../styles/globals.css";
import dynamic from "next/dynamic";

function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default dynamic(() => Promise.resolve(App), {
  ssr: false,
});

