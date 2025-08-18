import { UseFormSetError } from "react-hook-form";
import { SafeParseError } from "zod";

import { AllSteps } from "@/lib/validations/form-validation";

/**
 * Generic utils function that apply Error from Zod to the react-hook-form Context,
 * to display them inside the UI
 */
function applyZodErrorsToFormErrors(
  parsedData: SafeParseError<any>,
  setError: UseFormSetError<AllSteps>,
): void {
  const erroredFields = parsedData.error.issues.map((issue: any) => {
    return issue.path.join("-");
  }) as Array<keyof AllSteps>;

  erroredFields.forEach((errorField, i) => {
    if (errorField) {
      setError(errorField, {
        message: parsedData.error.issues[i].message,
      });
    }
  });
}

export default applyZodErrorsToFormErrors;
