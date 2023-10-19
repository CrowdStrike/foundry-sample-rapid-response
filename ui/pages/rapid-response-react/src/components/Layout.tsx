import { Toaster } from "react-hot-toast";
import { Outlet, useMatch, useNavigation } from "react-router-dom";

import { Loader } from "@/components/Loader";
import { useOnMount } from "@/lib/hooks/use-on-mount";

import Header from "@/components/Header";

function Layout() {
  const { state } = useNavigation();
  /**
   * This will help us determine when the view/html has fully load.
   * It seems that using only react-router causes issues when dealing with
   * portal.
   */
  const { hasMounted } = useOnMount();

  // Help us add styling options on specific cases
  const useFullHeight = useMatch("/job/:id");

  return (
    <>
      <Toaster position="top-right" />
      <div className="h-full bg-groundfloor">
        <Header />
        <div className="fixed inset-x-0 top-0 z-40" id="portal" />
        <div className={useFullHeight ? "h-full" : ""}>
          {state === "loading" || !hasMounted ? <Loader /> : <Outlet />}
        </div>
      </div>
    </>
  );
}

export default Layout;
