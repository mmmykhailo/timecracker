import { ClockIcon } from "@heroicons/react/24/outline";
import ActivitiesTable from "./ActivitiesTable";
import { ReportActivity } from "../utils/reports";
import { PlusIcon } from "@heroicons/react/24/solid";

type ActivitiesSectionProps = {
  activities: Array<ReportActivity>;
  onEditActivity: (activity: ReportActivity | "new") => void;
};

type PlaceholderProps = Pick<ActivitiesSectionProps, "onEditActivity">;

export default function ActivitiesSection({
  onEditActivity,
  activities,
}: ActivitiesSectionProps) {
  if (!activities.length) {
    return <Placeholder onEditActivity={onEditActivity} />;
  }

  return (
    <div>
      <div className="px-4 py-5 sm:px-6">
        <ActivitiesTable
          onEditActivity={onEditActivity}
          activities={activities}
        />
      </div>
      <div>
        <a
          href="#"
          className="block px-4 py-4 text-sm font-medium text-center text-gray-500 bg-gray-50 hover:text-gray-700 sm:rounded-b-lg"
          onClick={() => onEditActivity("new")}
        >
          Track more time test test test
        </a>
      </div>
    </div>
  );
}

function Placeholder({ onEditActivity }: PlaceholderProps) {
  return (
    <div className="py-6 text-center">
      <ClockIcon
        className="w-12 h-12 mx-auto text-gray-400"
        aria-hidden="true"
      />

      <h3 className="mt-2 text-sm font-medium text-gray-900">
        No tracked time
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by tracking some activity
      </p>
      <div className="mt-6">
        <button
          onClick={() => onEditActivity("new")}
          type="button"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="w-5 h-5 mr-2 -ml-1" aria-hidden="true" />
          New activity
        </button>
      </div>
    </div>
  );
}
