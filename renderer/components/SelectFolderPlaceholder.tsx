import React from "react";
import { ipcRenderer } from "electron";
import { PlusIcon } from "@heroicons/react/24/solid";

type SelectFolderPlaceholderProps = {
  setFolder: (path: string) => void;
};

const SelectFolderPlaceholder = ({
  setFolder,
}: SelectFolderPlaceholderProps) => {
  const clickHandler = () => {
    ipcRenderer.invoke("app:select-folder").then((folder: string | null) => {
      if (folder) {
        setFolder(folder);
      }
    });
  };

  return (
    <div className="py-16 text-center bg-white shadow sm:rounded-lg lg:col-start-1 lg:col-span-3">
      <svg
        className="w-12 h-12 mx-auto text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900">
        Select a Folder
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        To get started, select a folder to save the reports.
      </p>
      <div className="mt-6">
        <button
          type="button"
          onClick={clickHandler}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="w-5 h-5 mr-2 -ml-1" aria-hidden="true" />
          Select Folder
        </button>
      </div>
    </div>
  );
};

export default SelectFolderPlaceholder;
