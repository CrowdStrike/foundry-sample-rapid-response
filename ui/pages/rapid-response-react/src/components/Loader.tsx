/**
 * A React component to render an infinite Loader made with Tailwind
 */
export function Loader() {
  return (
    <div className="h-screen-without-header flex justify-center items-center">
      <div className="flex flex-col items-center gap-10 text-base relative">
        <div
          className="animate-spin inline-block w-10 h-10 border-[3px] border-current border-t-transparent text-csaqua rounded-full dark:text-white"
          role="status"
          aria-label="loading"
        >
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    </div>
  );
}
