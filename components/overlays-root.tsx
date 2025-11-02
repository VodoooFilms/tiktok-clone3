"use client";
import EditProfileOverlay from "@/components/overlays/edit-profile-overlay";
import CommentsOverlay from "@/components/overlays/comments-overlay";
import ShareOverlay from "@/components/overlays/share-overlay";

export default function OverlaysRoot() {
  return (
    <>
      <EditProfileOverlay />
      <CommentsOverlay />
      <ShareOverlay />
    </>
  );
}

