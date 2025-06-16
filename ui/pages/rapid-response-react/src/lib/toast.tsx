import { toast } from "react-hot-toast";
import { AnimatePresence, m as motion } from "framer-motion";

import SlIcon from "@shoelace-style/shoelace/dist/react/icon/index.js";

function toastEnhanced(message: string) {
  toast.custom((t) => (
    <AnimatePresence>
      <motion.div
        initial={{ right: "-50rem" }}
        animate={{ right: "0" }}
        transition={{
          type: "easeInOut",
          duration: 0.3,
        }}
        className="bg-cspopover shadow-rowTable relative text-base flex justify-between items-center h-16 px-4 py-5 w-[400px] before:content-[''] before:bg-csteal before:w-[4px] before:h-full before:absolute before:left-0"
      >
        <div className="flex gap-2 items-center">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-csteal">
            <SlIcon name="check-lg" style={{ color: "#222126" }} />
          </div>
          {message}
        </div>
        <button type="button" onClick={() => toast.dismiss(t.id)}>
          <SlIcon name="x-lg" />
        </button>
      </motion.div>
    </AnimatePresence>
  ));
}

export default toastEnhanced;
