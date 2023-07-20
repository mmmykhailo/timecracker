import { ipcRenderer } from "electron";
import FolderSelector from "./FolderSelector";
import { useEffect, useState } from "react";

const navigation = [
  { name: "Today", href: "#" },
  { name: "Month", href: "#" },
];
type HeaderProps = {
  setPath: (location: string) => void;
  selectedPath: string;
};

export default function Header({ setPath, selectedPath }: HeaderProps) {
  const [selectedDropboxLocation, setSelectedDropboxLocation] = useState("");

  const handleDropboxLocationChange = (path: string) => {
    setSelectedDropboxLocation(path);
    ipcRenderer.invoke("app:set-dropbox-folder", path);
  };

  useEffect(() => {
    (async () => {
      const savedLocation = await ipcRenderer.invoke("app:get-dropbox-folder");
      if (savedLocation) {
        setSelectedDropboxLocation(savedLocation);
      }
    })();
  }, []);

  useEffect(() => {
    setPath(selectedDropboxLocation);
  }, [selectedDropboxLocation]);

  useEffect(() => {
    setSelectedDropboxLocation(selectedPath);
  }, [selectedPath]);

  return (
    <header className="bg-white shadow">
      <div className="flex justify-between h-16 px-2 mx-auto max-w-7xl sm:px-4 lg:px-8">
        <div className="flex flex-shrink-0 px-2 lg:px-0">
          {/* <nav
            aria-label="Global"
            className="hidden md:ml-6 md:flex md:items-center md:space-x-4"
          >
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-gray-900"
              >
                {item.name}
              </a>
            ))}
          </nav> */}
        </div>
        <div className="flex items-center flex-shrink min-w-0 gap-4">
          <FolderSelector
            folderLocation={selectedDropboxLocation}
            setFolderLocation={handleDropboxLocationChange}
          />
        </div>
      </div>
    </header>
  );
}
