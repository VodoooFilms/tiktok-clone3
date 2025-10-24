"use client";
import AuthOverlay from "@/components/overlays/auth-overlay";
import EditProfileOverlay from "@/components/overlays/edit-profile-overlay";
import CommentsOverlay from "@/components/overlays/comments-overlay";
import ShareOverlay from "@/components/overlays/share-overlay";

export default function OverlaysRoot() {
  return (
    <>
      <AuthOverlay />
      <EditProfileOverlay />
      <CommentsOverlay />
      <ShareOverlay />
    </>
  );
}

