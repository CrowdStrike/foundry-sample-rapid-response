import { AnimatePresence, m as motion } from "framer-motion";

import { CollapseIcon, HostsIcon } from "@/lib/icons";

interface Props {
  activeHosts: string[];
  handleHostsForDrawer: (hosts: string[]) => () => void;
}

export function Drawer({ activeHosts, handleHostsForDrawer }: Props) {
  return (
    <AnimatePresence>
      {activeHosts.length > 0 && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "33.333333%" }}
          exit={{ width: 0 }}
          className="w-1/3 bg-csdetailsbg border-l-[1.5px] border-cstablecolorborder"
        >
          <div className="px-4 h-12 bg-cssurfacesinner flex items-center justify-between">
            <span className="text-lg">Hosts</span>
            <button
              type="button"
              onClick={handleHostsForDrawer([])}
              className="p-1 h-8 w-8 border border-solid shadow-csbutton border-csinputcolorborder text-center text-xs bg-variantDark hover:bg-csbuttonsecondaryhover active:bg-csbuttonsecondaryactive rounded-sm cursor-pointer flex items-center"
            >
              <CollapseIcon
                height={24}
                width={24}
                className="fill-cstitlesandattributes"
              />
            </button>
          </div>
          <div className="pl-4 py-8 flex flex-col">
            <div className="flex items-center">
              <HostsIcon
                height={24}
                width={24}
                className="fill-cstitlesandattributes"
              />
              <span className="pl-2">
                {activeHosts?.length} host
                {activeHosts?.length && activeHosts?.length > 1 ? "s" : ""}{" "}
                targeted
              </span>
            </div>
            <div className="px-4 h-12 mt-8 bg-cssurfacesinner flex items-center justify-between">
              Host{activeHosts.length > 1 ? "s" : ""} name
              {activeHosts.length > 1 ? "s" : ""}
            </div>
            <div
              className="flex flex-col [&>div:nth-child(even)]:bg-cstablebackgroundeven overflow-y-scroll"
              style={{ maxHeight: "calc(100vh - 398px)" }} // Height of viewport minus multiple headers and pagination bar
            >
              {activeHosts?.map((host) => (
                <div
                  key={host}
                  className="px-4 min-h-[3rem] h-12 flex items-center justify-between"
                >
                  {host}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
