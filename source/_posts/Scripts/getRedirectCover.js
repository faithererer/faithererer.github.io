// getRedirectCover.js

async function fetchCoverUrl(tp) {
    const apiUrl = "https://www.loliapi.com/acg/";
    // Optional: Define a default cover if the API fails
    const defaultCover = ""; // e.g., "Assets/default_cover.png" or leave empty
  
    console.log("Templater (fetchCoverUrl): Fetching cover from", apiUrl);
  
    try {
      // Use fetch. It automatically follows redirects.
      // We don't need the body, so 'HEAD' might be slightly faster if the API supports it,
      // but 'GET' is safer and usually works. Let's stick with 'GET'.
      const response = await fetch(apiUrl, { method: 'GET' });
  
      // Check if the final request (after redirect) was successful
      if (!response.ok) {
        console.error(`Templater (fetchCoverUrl): API request failed with status ${response.status}. Final URL: ${response.url}`);
        return defaultCover;
      }
  
      // response.url contains the final URL after all redirects
      const finalUrl = response.url;
      console.log("Templater (fetchCoverUrl): Successfully fetched cover URL:", finalUrl);
  
      // Optional check: Ensure the final URL looks like an image
      if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(finalUrl)) {
         console.warn(`Templater (fetchCoverUrl): Warning - Final URL might not be an image: ${finalUrl}`);
         // You could return defaultCover here if you only want confirmed image URLs
      }
  
      return finalUrl; // Return the final URL
  
    } catch (error) {
      console.error("Templater (fetchCoverUrl): Error fetching cover URL:", error);
      return defaultCover; // Return default on network error etc.
    }
  }
  
  // Make the function available to Templater
  module.exports = fetchCoverUrl;
  