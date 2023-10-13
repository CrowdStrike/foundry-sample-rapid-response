import SlIcon from "@shoelace-style/shoelace/dist/react/icon/index.js";

interface Props {
  errorMessage: string;
}

export function ErrorInput({ errorMessage }: Props) {
  return (
    <span className="flex items-center gap-2 font-normal text-cscritical">
      <SlIcon name="exclamation-triangle"></SlIcon>
      {errorMessage}
    </span>
  );
}
