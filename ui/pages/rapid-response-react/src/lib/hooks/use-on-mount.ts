import { useEffect, useState } from "react";

/**
 * A hook helper to know when a component has been fully mounted on the DOM
 */
export function useOnMount() {
  const [hasMounted, setMount] = useState(false);

  useEffect(() => {
    setMount(true);
  }, []);

  return { hasMounted };
}
