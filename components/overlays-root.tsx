"use client";
import AuthOverlay from "@/components/overlays/auth-overlay";
import EditProfileOverlay from "@/components/overlays/edit-profile-overlay";

export default function OverlaysRoot() {
  return (
    <>
      <AuthOverlay />
      <EditProfileOverlay />
    </>
  );
}

