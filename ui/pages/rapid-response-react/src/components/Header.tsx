import { useMemo } from "react";
import { AnimatePresence, m as motion } from "framer-motion";
import { NavLink, useMatch } from "react-router-dom";

const navigation = [
  { path: "/all-jobs", name: "All jobs" },
  { path: "/run-history", name: "Run history" },
  { path: "/audit-log", name: "Audit log" },
];

function Header() {
  /**
   * We have to hide the navigation Header on those
   * routes patterns.
   */
  const createJobPage = useMatch("/create-job");
  const jobEditPage = useMatch("/job/:id/edit");
  const jobDetailsPage = useMatch("/job/:id");

  const shouldShowHeader = useMemo(
    () =>
      [createJobPage, jobEditPage, jobDetailsPage].every(
        (page) => page === null,
      ),
    [createJobPage, jobEditPage, jobDetailsPage],
  );

  if (!shouldShowHeader) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          type: "easeInOut",
          duration: 0.3,
        }}
        className={`w-full inset-x-0 top-0 z-40 flex h-16 items-center border-t border-cstablecolorborder bg-mezzanine shadow-csbutton`}
      >
        <div className="bg-surfaceinner ml-4 rounded p-3 shadow-elevationinset">
          {navigation.map((nav) => (
            <NavLink
              to={nav.path}
              key={nav.path}
              className={({ isActive, isPending }) => {
                let className =
                  "buttonHeader no-underline rounded-sm font-medium	text-base py-2 px-6 mx-1";
                if (isPending) className += " pending";
                else if (isActive)
                  className += " border-b-2 border-cspurple bg-surfacemd";

                return className;
              }}
            >
              {nav.name}
            </NavLink>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default Header;
