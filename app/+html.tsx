import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>NRI Kids! 🐒 Learn Your Roots</title>
        <meta name="description" content="Fun language lessons for NRI kids! Learn Tamil, Hindi, Telugu, Malayalam & Kannada with games, stories and more." />
        <meta property="og:title" content="NRI Kids! 🌺 Learn Your Heritage Language" />
        <meta property="og:description" content="Fun lessons. Real fluency. Every day! Join thousands of NRI kids learning their heritage language." />
        <meta property="og:image" content="https://nri-language-learning.vercel.app/og-image.png" />
        <meta property="og:url" content="https://nri-language-learning.vercel.app" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="NRI Kids!" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="NRI Kids! Learn Your Heritage Language" />
        <meta name="twitter:description" content="Fun lessons. Real fluency. Every day!" />
        <meta name="twitter:image" content="https://nri-language-learning.vercel.app/og-image.png" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}`;
