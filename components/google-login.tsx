"use client";

import { account } from "@/lib/appwrite";
import { OAuthProvider } from "appwrite";
import { useState } from "react";

export default function GoogleLoginButton() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      
      // Use production URL from environment variables
      const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      console.log('Debug - Redirect URL:', redirectUrl);
      
      // Create the OAuth2 session with Appwrite
      await account.createOAuth2Session(
        OAuthProvider.Google,
        redirectUrl, // Success URL
        `${redirectUrl}/auth/error` // Failure URL
      );
    } catch (error) {
      console.error("Google login error:", error);
      alert("Error connecting with Google. Please try again.");
    } finally {
      setLoading(false); 
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={loading}
      className={`flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition ${
        loading ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {loading ? (
        <span>Connecting...</span>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 488 512" 
            className="w-5 h-5"
            fill="currentColor"
          >
            <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8a240.7 240.7 0 01168.5 65.3l-68.4 65.5C324.2 101.5 288.9 88 248 88c-90.7 0-164.4 73.6-164.4 164S157.3 416 248 416c84.8 0 142.7-48.3 150.1-115H248v-91.2h240v52z" />
          </svg>
          Continue with Google
        </>
      )}
    </button>
  );
}