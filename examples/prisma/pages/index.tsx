import React from "react";
import { useSession } from "next-auth/react";
import { signOut, signIn } from "next-auth/react";

const Home = () => {
  const session = useSession();

  return (
    <div>
      <h3>Auth session:</h3>
      {session?.data?.user?.image && (
        <>
          <img
            width="50px"
            height="50px"
            src={session.data.user?.image}
            alt={`Avatar of ${session.data.user?.name}`}
          />
          <br />
        </>
      )}

      <pre>{JSON.stringify(session, null, 2)}</pre>

      {session && session.data ? (
        <button onClick={() => signOut()}>Sign out</button>
      ) : (
        <button onClick={() => signIn()}>Sign in</button>
      )}
    </div>
  );
};

export default Home;
