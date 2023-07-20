import { shallow } from "zustand/shallow";
import FolderSelector from "./FolderSelector";
import { useMainStore } from "../store/mainStore";

// const navigation = [
//   { name: "Today", href: "#" },
//   { name: "Month", href: "#" },
// ];

export default function Header() {
  const [reportsFolder, setReportsFolder] = useMainStore(
    (state) => [state.reportsFolder, state.setReportsFolder],
    shallow
  );

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
            folderLocation={reportsFolder}
            setFolderLocation={setReportsFolder}
          />
        </div>
      </div>
    </header>
  );
}
