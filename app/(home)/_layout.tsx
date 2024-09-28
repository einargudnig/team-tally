import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";

export default function Layout() {
  const { isSignedIn } = useAuth()
  console.log({ isSignedIn })

  if (isSignedIn) {
    // return <Redirect href={'/'} />
    console.log('this is showed since our user is logged in!')
  }


  return <Stack />
}
