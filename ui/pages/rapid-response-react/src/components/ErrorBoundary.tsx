import { EmptyStateSVG } from "@/lib/icons";
import { useState } from "react";
import { Link, useRouteError } from "react-router-dom";

interface Props {
  is404Error?: boolean;
}

export function ErrorBoundary({ is404Error = false }: Props) {
  const error = useRouteError();
  const [shouldShowErrorDetails, setErrorDetails] = useState(false);
  console.error(error);

  const onShowErrorDetails = () => {
    setErrorDetails(!shouldShowErrorDetails);
  };

  return (
    <div className="h-screen-without-header flex justify-center items-center">
      <div className="flex flex-col items-center gap-10 text-base">
        <EmptyStateSVG />
        <div className="flex flex-col gap-5 items-center">
          <h2 className="text-2xl">
            {is404Error ? "404 - Page not found" : "An error has happened"}
          </h2>
          {is404Error ? null : (
            <button
              type="button"
              className="text-csbodyandlabels underline"
              onClick={onShowErrorDetails}
            >
              Learn more
            </button>
          )}
          {shouldShowErrorDetails ? (
            <p className="w-2/4 m-auto">
              {JSON.stringify(error, undefined, 4)}
            </p>
          ) : null}
          <Link
            to="/"
            className="cursor-pointer rounded-sm border border-solid border-inputborder bg-csbuttonprimary hover:bg-csbuttonprimaryhover active:bg-csbuttonprimaryfocus px-12 py-2 text-center text-xs text-black shadow-csbutton"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
