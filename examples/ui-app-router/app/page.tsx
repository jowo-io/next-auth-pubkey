import { getServerSession } from "next-auth";

import { authOptions } from "@/utils/nextauth";
import { SignInButton } from "./components/SignInButton";

const Home = async () => {
  const session = await getServerSession(authOptions);

  return (
    <div>
      <h3>Auth session:</h3>

      {session?.user?.image && (
        <>
          <img
            width="50px"
            height="50px"
            src={session.user?.image}
            alt={`Avatar of ${session.user?.name}`}
          />
          <br />
        </>
      )}

      <pre>{JSON.stringify({ session }, null, 2)}</pre>

      <SignInButton session={session} />
    </div>
  );
};

export default Home;
