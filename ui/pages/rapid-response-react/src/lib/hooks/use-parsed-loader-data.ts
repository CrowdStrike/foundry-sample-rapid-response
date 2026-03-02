import { useLoaderData } from "react-router-dom";
import { ZodType } from "zod";
import { AllSchemas } from "@/lib/validations/api-validation";

export function useParsedLoaderData<T extends AllSchemas>(schema: ZodType): T {
  const data: unknown = useLoaderData();
  try {
    return schema.parse(data) as T;
  } catch (error: unknown) {
    console.error("Could not parse data!", { schema, data });

    throw new Error(
      error instanceof Error ? error.message : "Could not parse data!",
    );
  }
}
