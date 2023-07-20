import { ipcRenderer } from "electron";
import { useEffect, useState } from "react";
import { shallow } from "zustand/shallow";
import DateSelector from "../components/DateSelector";
import Header from "../components/Header";
import { ReportActivity, parseReport, serializeReport } from "../utils/reports";
import TrackTimeModal from "../components/TrackTimeModal";
import ManualInputForm from "../components/ManualInputForm";
import ActivitiesSection from "../components/ActivitiesSection";
import SelectFolderPlaceholder from "../components/SelectFolderPlaceholder";
import { useMainStore } from "../store/mainStore";

export default function Home() {
  const [reportsFolder, setReportsFolder] = useMainStore(
    (state) => [state.reportsFolder, state.setReportsFolder],
    shallow
  );

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDateReport, setSelectedDateReport] = useState("");
  const [selectedDateActivities, setSelectedDateActivities] =
    useState<Array<ReportActivity> | null>([]);
  const [shouldAutosave, setShouldAutosave] = useState(false);
  const [trackTimeModalActivity, setTrackTimeModalActivity] = useState<
    ReportActivity | "new"
  >(null);
  const [latestProjects, setLatestProjects] = useState<Array<string>>([]);

  useEffect(() => {
    (async () => {
      const dayReport = await ipcRenderer.invoke(
        "app:read-day-report",
        reportsFolder,
        selectedDate
      );
      setSelectedDateReport(dayReport || "");

      setLatestProjects(
        await ipcRenderer.invoke(
          "app:find-latest-projects",
          reportsFolder,
          selectedDate
        )
      );
    })();
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDateReport) {
      const activities = parseReport(selectedDateReport);
      setSelectedDateActivities(activities);
      return;
    }
    setSelectedDateActivities([]);
  }, [selectedDateReport]);

  // Save report on change
  useEffect(() => {
    if (shouldAutosave) {
      const serializedReport = serializeReport(selectedDateActivities);
      saveSerializedReport(serializedReport);
      setShouldAutosave(false);
    }
  }, [selectedDateActivities]);

  const saveSerializedReport = (serializedReport: string) => {
    ipcRenderer.invoke(
      "app:write-day-report",
      reportsFolder,
      selectedDate,
      serializedReport
    );
    setSelectedDateReport(serializedReport);
  };

  const submitActivity = (activity: ReportActivity) => {
    setShouldAutosave(true);
    if (activity.id === null) {
      setSelectedDateActivities((activities) => [
        ...activities,
        {
          ...activity,
          id: activities.reduce((id, curr) => {
            if (curr.id >= id) return curr.id + 1;
            return id;
          }, 0),
        },
      ]);
      return;
    }

    setSelectedDateActivities((activities) => {
      const activityIndex = activities.findIndex(
        (act) => act.id === activity.id
      );
      activities[activityIndex] = activity;
      return [...activities];
    });
  };
  const handleSave = (report: string, shouldAutosave: boolean) => {
    setSelectedDateReport(report);
    setShouldAutosave(shouldAutosave);
  };

  return (
    <div className="min-h-full">
      <Header />

      <main className="py-10">
        <div className="grid max-w-3xl grid-cols-1 gap-6 mx-auto sm:px-6 lg:max-w-7xl lg:grid-flow-col-dense lg:grid-cols-3">
          {reportsFolder ? (
            <>
              <div className="space-y-6 lg:col-start-1 lg:col-span-2">
                <section>
                  <div className="bg-white shadow sm:rounded-lg">
                    <DateSelector
                      selectedDate={selectedDate}
                      setSelectedDate={setSelectedDate}
                    />
                  </div>
                </section>
                <section>
                  <div className="bg-white shadow sm:rounded-lg">
                    <ActivitiesSection
                      activities={selectedDateActivities}
                      onEditActivity={setTrackTimeModalActivity}
                    />
                  </div>
                </section>
              </div>

              <section
                aria-labelledby="manual-input-title"
                className="lg:col-start-3 lg:col-span-1"
              >
                <div className="px-4 py-5 bg-white shadow sm:rounded-lg sm:px-6">
                  <ManualInputForm
                    onSave={handleSave}
                    selectedDateReport={selectedDateReport}
                  />
                </div>
              </section>
            </>
          ) : (
            <SelectFolderPlaceholder setFolder={setReportsFolder} />
          )}
        </div>
      </main>
      <TrackTimeModal
        isOpen={trackTimeModalActivity !== null}
        editedActivity={trackTimeModalActivity}
        latestProjects={latestProjects}
        close={() => setTrackTimeModalActivity(null)}
        submitActivity={submitActivity}
      />
    </div>
  );
}
