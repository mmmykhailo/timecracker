import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { get as idbGet, set as idbSet } from "idb-keyval";
import { Button } from "~/components/ui/button";
import { AppHeader } from "~/components/app-header";
import HoursCalendar from "~/components/hours-calendar";
import {
  calculateDailyDurations,
  DATE_FORMAT,
  readReport,
  readReports,
  writeReport,
  type Report,
  type ReportEntry,
  type Reports,
} from "~/lib/reports";
import EntryForm from "~/components/entry-form";
import ReportEntryCard from "~/components/report-entry-card";
import DateControls from "~/components/date-controls";
import {
  redirect,
  useActionData,
  useLoaderData,
  useNavigate,
  type ClientActionFunctionArgs,
} from "react-router";
import { RotateCw } from "lucide-react";
import { getDotPath, safeParse } from "valibot";
import { EntryFormSchema } from "~/lib/schema";
import { Badge } from "~/components/ui/badge";

export function meta() {
  return [
    { title: "Timecracker" },
    { name: "description", content: "Stupidly simple timetracker" },
  ];
}

export async function clientLoader() {
  const rootHandle: FileSystemDirectoryHandle | undefined =
    await idbGet("rootHandle");

  if (!rootHandle) {
    return redirect("/welcome");
  }

  return {
    reports: await readReports(rootHandle),
  };
}

export async function clientAction({ request }: ClientActionFunctionArgs) {
  const body = await request.formData();
  const intent = body.get("intent")?.toString();

  // todo: refactor to avoid duplicating code
  switch (intent) {
    case "edit-entry": {
      const entryFormData = {
        start: body.get("start")?.toString(),
        end: body.get("end")?.toString(),
        project: body.get("project")?.toString(),
        activity: body.get("activity")?.toString(),
        description: body.get("description")?.toString(),
        date: body.get("date")?.toString(),
        entryIndex: body.get("entryIndex")?.toString(),
      };

      const parsedEntryFormData = safeParse(EntryFormSchema, entryFormData);

      if (!parsedEntryFormData.success) {
        return {
          entryFormIssues: parsedEntryFormData.issues,
        };
      }

      const dateString = parsedEntryFormData.output.date;
      const entryIndex = parsedEntryFormData.output.entryIndex;

      const entry: ReportEntry = {
        start: parsedEntryFormData.output.start,
        end: parsedEntryFormData.output.end,
        duration: 0,
        project: parsedEntryFormData.output.project,
        activity: parsedEntryFormData.output.activity || null,
        description: parsedEntryFormData.output.description,
      };

      const rootHandle: FileSystemDirectoryHandle | undefined =
        await idbGet("rootHandle");
      if (!rootHandle || entryIndex === null || Number.isNaN(entryIndex)) {
        console.error(rootHandle, entryIndex);
        return;
      }

      const report = await readReport(rootHandle, dateString);

      const entries = report?.entries;

      if (!entries) {
        return null;
      }

      entries[entryIndex] = entry;

      await writeReport(rootHandle, dateString, entries);

      const updatedReport = await readReport(rootHandle, dateString);

      if (!updatedReport) {
        return null;
      }

      return {
        updatedReports: {
          [dateString]: updatedReport || { entries: [] },
        },
      };
    }
    case "delete-entry": {
      const dateString = body.get("date")?.toString();

      const entryIndexString = body.get("entryIndex")?.toString();
      const entryIndex = entryIndexString
        ? Number.parseInt(entryIndexString, 10)
        : null;

      if (entryIndex === null || Number.isNaN(entryIndex)) {
        return;
      }

      const rootHandle: FileSystemDirectoryHandle | undefined =
        await idbGet("rootHandle");
      if (
        !rootHandle ||
        !dateString ||
        entryIndex === null ||
        Number.isNaN(entryIndex)
      ) {
        console.error(rootHandle, dateString, entryIndexString, entryIndex);
        return;
      }

      const report = await readReport(rootHandle, dateString);
      if (!report?.entries) {
        console.error("Could not parse report");
        throw "Handle this";
      }

      const entries = report.entries;

      entries.splice(entryIndex, 1);

      await writeReport(rootHandle, dateString, entries);

      const updatedReport = await readReport(rootHandle, dateString);

      return {
        updatedReports: {
          [dateString]: updatedReport || { entries: [] },
        },
      };
    }
  }
}

export default function Home() {
  const { reports: loaderReports } = useLoaderData<typeof clientLoader>();
  const actionData = useActionData<typeof clientAction>();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reports, setReports] = useState<Reports>(loaderReports || {});
  const [entryIndexToEdit, setEntryIndexToEdit] = useState<number | null>(null);

  useEffect(() => {
    if (typeof actionData?.updatedReports === "object") {
      setReports((oldReports) => ({
        ...oldReports,
        ...actionData.updatedReports,
      }));
    }
  }, [actionData?.updatedReports]);

  const selectedReport: Report = useMemo(() => {
    return (
      reports[format(selectedDate, DATE_FORMAT)] || {
        entries: [],
      }
    );
  }, [selectedDate, reports]);

  return (
    <>
      <AppHeader />
      <div className="flex flex-col lg:grid lg:grid-cols-12 flex-1 gap-4 p-4 mt-8">
        <div className="flex flex-col gap-4 col-span-8">
          <div className="flex justify-between flex-wrap gap-2">
            <Button size="icon" variant="outline" onClick={() => navigate(0)}>
              <RotateCw />
            </Button>
            <DateControls
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
          </div>
          <div className="grid auto-rows-min gap-4">
            <div className="rounded-xl border">
              <HoursCalendar
                // isCompact
                dailyDurations={calculateDailyDurations(reports)}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />
            </div>
          </div>
        </div>
        <div className="col-span-4 flex flex-col gap-4">
          {!selectedReport.issues && (
            <div className="col-span-4 flex flex-col gap-4">
              {selectedReport.entries?.length ? (
                selectedReport.entries.map((reportEntry, i) => (
                  <ReportEntryCard
                    key={`${reportEntry.start}-${reportEntry.end}-${i}`}
                    entryIndex={i}
                    entry={reportEntry}
                    selectedDate={selectedDate}
                    onEditClick={() => {
                      setEntryIndexToEdit(i);
                    }}
                  />
                ))
              ) : (
                <div className="rounded-lg border p-3 text-muted-foreground">
                  No entries yet
                </div>
              )}
            </div>
          )}
          {!!selectedReport.issues && (
            <div className="col-span-4 flex flex-col gap-4">
              {selectedReport.issues?.map((issue) => (
                <div
                  key={getDotPath(issue)}
                  className="rounded-lg border p-3 text-muted-foreground"
                >
                  <p>{issue.message}</p>
                  {typeof issue.input === "string" && (
                    <p>
                      Invalid value:{" "}
                      <Badge
                        variant="destructive"
                        className="max-w-full line-clamp-1 break-words inline-flex"
                      >
                        {issue.input}
                      </Badge>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          <Button
            onClick={() =>
              setEntryIndexToEdit(selectedReport.entries?.length || 0)
            }
          >
            Add new entry
          </Button>
        </div>
      </div>
      <EntryForm
        report={selectedReport}
        issues={actionData?.entryFormIssues}
        entryIndex={entryIndexToEdit}
        selectedDate={selectedDate}
        onClose={() => setEntryIndexToEdit(null)}
      />
    </>
  );
}
