import { useState } from "react";

import SlIcon from "@shoelace-style/shoelace/dist/react/icon/index.js";
import SlInput from "@shoelace-style/shoelace/dist/react/input/index.js";

import { usePutFilesData } from "@/lib/hooks/use-put-files-data";
import { FileToInstall } from "@/lib/validations/api-validation";

interface Props {
  onSelectFile: (file: FileToInstall) => void;
}

function RTRPutFiles({ onSelectFile }: Props) {
  const { files } = usePutFilesData();

  const [selected, setSelected] = useState<string | null>(null);
  const [filteredResults, setFilteredResults] =
    useState<FileToInstall[]>(files);
  const [searchvalue, setSearchValue] = useState("");

  const shouldDisplayLine = (item: FileToInstall, inputSearchValue: string) => {
    return (
      item.name
        .toLocaleLowerCase()
        .includes(inputSearchValue.toLocaleLowerCase()) ||
      (item.description ?? "")
        .toLocaleLowerCase()
        .includes(inputSearchValue.toLocaleLowerCase())
    );
  };

  const handleSearch = (e: Event) => {
    if (!e.target) {
      return;
    }

    const target = e.target as HTMLInputElement;
    const value = target.value;
    setSearchValue(value);
    onSetFilteredResults(value);
  };

  const handleRadioChange = (id: string) => () => {
    const selectedFile = files.find((e) => e.id === id);
    if (!selectedFile) {
      return;
    }

    onSelectFile(selectedFile);
    setSelected(id);
  };

  const onSetFilteredResults = (inputSearchValue: string) => {
    const selectedElement = files.find((e) => e.id === selected);
    if (selectedElement !== undefined) {
      setFilteredResults([
        selectedElement,
        ...files.filter((file) => {
          // We dont want to have two times the selected file element.
          if (selectedElement.id === file.id) {
            return false;
          }

          return shouldDisplayLine(file, inputSearchValue);
        }),
      ]);
    } else {
      setFilteredResults(
        files.filter((file) => shouldDisplayLine(file, inputSearchValue)),
      );
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <SlInput
        placeholder="Search by name or description"
        onSlInput={handleSearch}
        className="slInputRtrPutFiles"
      >
        <SlIcon name="search" slot="suffix" />
      </SlInput>
      <table className="w-full text-left z-[1]">
        <thead className="flex w-full bg-cssurfacesinner table">
          <tr className="flex w-full h-8 mb-4">
            <th className="p-4 w-[8%]"></th>
            <th className="p-4 w-[46%]">Name</th>
            <th className="p-4 w-[46%]">Description</th>
          </tr>
        </thead>
        {filteredResults.length === 0 ? (
          <tbody>
            <tr className="mt-3 w-full flex flex-col items-center gap-5">
              <td className="text-2xl">
                {searchvalue === ""
                  ? "No RTR scripts are available."
                  : "No results found"}
              </td>
              <td>
                {searchvalue === ""
                  ? "Upload new RTR scripts."
                  : "Try changing your filter selection"}
              </td>
            </tr>
          </tbody>
        ) : (
          <tbody className="bg-grey-light overflow-y-scroll w-full block h-[218px] overflow-auto">
            {filteredResults.map((row) => (
              <tr
                key={row.id}
                className={`flex w-full h-12 cursor-pointer ${
                  selected === row.id ? "selected bg-dropfilebgcolor" : ""
                } hover:bg-dropfilebgcolor flex table-fixed`}
                onClick={handleRadioChange(row.id)}
              >
                <td className="flex w-[6%] h-full items-center justify-center">
                  <input
                    type="radio"
                    name="fileName"
                    value={row.name}
                    onChange={handleRadioChange(row.id)}
                    checked={selected === row.id}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 accent-csaqua"
                  />
                </td>
                <td className="flex items-center h-full p-4 w-[47%]">
                  {row.name}
                </td>
                <td className="flex items-center h-full p-4 w-[47%]">
                  {row.description ?? "- -"}
                </td>
              </tr>
            ))}
          </tbody>
        )}
      </table>
    </div>
  );
}

export default RTRPutFiles;
