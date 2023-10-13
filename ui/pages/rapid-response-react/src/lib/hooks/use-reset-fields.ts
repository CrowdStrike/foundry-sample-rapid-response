import { UseFormClearErrors } from "react-hook-form";
import { useEffect } from "react";

import { AllSteps } from "@/lib/validations/form-validation";

interface Props {
  clearErrors: UseFormClearErrors<AllSteps>;
  deps: React.DependencyList | undefined;
  fieldsToReset: (keyof AllSteps)[];
}

/**
 * This hook is used to manually clear errors that could be raised due
 * to missing data filled by users on <SlSelect />.
 * react-hook-form can't infer the way SlSelect handle changes and value inside the input
 * so we must clear the error manually when needed.
 */
export function useResetFields({ clearErrors, deps, fieldsToReset }: Props) {
  useEffect(() => {
    return () => {
      fieldsToReset.forEach((n) => {
        clearErrors(n);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
