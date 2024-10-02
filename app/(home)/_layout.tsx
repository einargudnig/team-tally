import { useAuth } from "@clerk/clerk-expo";
import { Slot } from "expo-router";

export default function Layout() {
  // not sure I will need this check here?
  // might do some redirect? but I can also do it in the index file
  const { isSignedIn } = useAuth();
  console.log({ isSignedIn });

  console.log("this is showed since our user is logged in!");
  // For now this will not have anything else here,
  // it used to have some Clerk Control components, but they have been moved
  return (
    <>
      <Slot />
    </>
  );
}

