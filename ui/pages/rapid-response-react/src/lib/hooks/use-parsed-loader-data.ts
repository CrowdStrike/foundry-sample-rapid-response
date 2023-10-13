import { useLoaderData } from "react-router-dom";
import { ZodType } from "zod";
import { AllSchemas } from "@/lib/validations/api-validation";

export function useParsedLoaderData<T extends AllSchemas>(schema: ZodType): T {
  const data = useLoaderData();
  try {
    return schema.parse(data) as T;
  } catch (error) {
    console.error("Could not parse data!", { schema, data });

    throw { error, data };
  }
}
