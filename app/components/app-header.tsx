import { Form, Link } from "react-router";
import { Button } from "./ui/button";
import ThemeSwitcher from "./theme-switcher";

export function AppHeader() {
  return (
    <div className="border-b">
      <div className="flex items-center justify-between px-4 py-6">
        <nav className="mx-6 flex flex-wrap items-center gap-4 lg:gap-6">
          <Link
            className="font-medium text-sm transition-colors hover:text-primary"
            to="/"
          >
            Overview
          </Link>
          <Link
            className="font-medium text-sm transition-colors hover:text-primary"
            to="/stats"
          >
            Stats
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Form method="POST" action="/?index">
            <input type="hidden" name="intent" value="close-directory" />
            <Button variant="outline" type="submit">
              Close current directory
            </Button>
          </Form>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
}
