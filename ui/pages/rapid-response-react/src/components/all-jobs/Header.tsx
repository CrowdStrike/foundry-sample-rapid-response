import { Link } from "react-router-dom";

interface Props {
  totalJobs: number;
}

export function Header({ totalJobs }: Props) {
  return (
    <div className="py-6 px-8">
      <div className="w-full flex justify-between items-center">
        <h1 className="flex gap-1 text-3xl">
          All jobs
          <span className="text-csbodyandlabels">{totalJobs} total</span>
        </h1>
        <Link
          to="/create-job"
          className="mr-8 py-2 px-12 h-8 border border-solid shadow-csbutton border-csinputcolorborder text-csbuttoncolortext text-center font-medium text-sm leading-4 bg-csbuttonprimary hover:bg-csbuttonprimaryhover active:bg-csbuttonprimaryfocus rounded-sm cursor-pointer"
        >
          Create job
        </Link>
      </div>
    </div>
  );
}
