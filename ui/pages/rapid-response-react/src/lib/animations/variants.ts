import { Variants } from "framer-motion";

export const initialVariants: Variants = {
  enter: (direction: "forward" | "backward" | null) => {
    return {
      y: direction === "forward" ? "30rem" : "-40rem",
      opacity: 0,
    };
  },
  center: {
    y: 0,
    opacity: 1,
  },
  exit: (direction: "forward" | "backward" | null) => {
    return {
      position: "absolute",
      width: "100%",
      y: direction === "backward" ? "30rem" : "-40rem",
      opacity: 0,
    };
  },
};
