import { toast } from "sonner";
import { Button } from "../ui/button";

const API_URL: string = import.meta.env.VITE_API_URL || "";
const CLIENT_URL: string = import.meta.env.VITE_CLIENT_URL || "";

export function GithubLoginButton() {
  const handleGithubLoginClick = async () => {
    const url = new URL(`${API_URL}/auth/github`);

    url.searchParams.set("redirect_uri", `${CLIENT_URL}/auth/github/callback`);

    const response = await fetch(url.toString());

    const json = await response.json();

    if (!json?.url) {
      toast("Something went wrong, please try again later");
      return;
    }

    window.location.href = json.url;
  };

  return <Button onClick={handleGithubLoginClick}>Login with GitHub</Button>;
}
