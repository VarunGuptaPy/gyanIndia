import SiteLayout from "./(site)/layout";
import SiteNotFound from "./(site)/not-found";

// Unmatched URLs render inside the public site chrome.
export default function RootNotFound() {
  return (
    <SiteLayout>
      <SiteNotFound />
    </SiteLayout>
  );
}
