import { useEffect, useState, useRef } from "react";
import { Button } from "../../shared/Button";
import { DeleteMessage } from "../../shared/DeleteMessage";
import { parseReport, serializeReport } from "../../helpers/utils/reports";
import { getCurrentTimeRoundedUp } from "../../helpers/utils/datetime-ui";
import { useMainStore } from "../../store/mainStore";
import { shallow } from "zustand/shallow";
import useUndoManager from "../../helpers/hooks/useUndoManager";
import { ManualInputFormProps } from './types';

export default function ManualInputForm({
  onSave,
  selectedDateReport,
  selectedDate,
  setSelectedDateReport,
}: ManualInputFormProps) {
  const [reportsFolder] = useMainStore(
    (state) => [state.reportsFolder, state.setReportsFolder],
    shallow
  );
  const [report, setReport] = useState("");
  const [saveBtnStatus, setSaveBtnStatus] = useState("disabled");
  const textareaRef = useRef(null);
  const [showDeleteMessage, setShowDeleteMessage] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [isFileExist, setIsFileExist] = useState(false);
  const undoManager = useUndoManager(report);

  const saveOnPressHandler = (e: KeyboardEvent) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      e.code === "KeyS" &&
      saveBtnStatus === "enabled"
    ) {
      saveReportHandler();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", saveOnPressHandler);

    return () => {
      document.removeEventListener("keydown", saveOnPressHandler);
    };
  }, []);

  useEffect(() => {
    setShowDeleteMessage(false);

    (async () => {
      const dayReport = await global.ipcRenderer.invoke(
        "app:read-day-report",
        reportsFolder,
        selectedDate
      );

      setIsFileExist(dayReport !== null);
      setShowDeleteButton(dayReport === "");
    })();
  }, [selectedDate]);

  useEffect(() => {
    setReportHandler(selectedDateReport);
  }, [selectedDateReport]);

  useEffect(() => {
    undoManager.setValue(report);
    setReportHandler(report);

    if (isFileExist) {
      setShowDeleteButton(!report.length);
    } else {
      setShowDeleteButton(false);
    }
  }, [report]);

  const saveReportHandler = () => {
    global.ipcRenderer.send("send-analytics-data", "manuall_save");
    onSave(report, true);
    setSaveBtnStatus("inprogress");
    setIsFileExist(true);
  };

  const setReportHandler = (report: string) => {
    setSaveBtnStatus(selectedDateReport !== report ? "enabled" : "disabled");
    setReport(report);
  };

  const textAreaKeyHandler = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.code === "KeyD") {
      e.preventDefault();
      copyCurrentLine();
    }

    if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ") {
      e.preventDefault();
      const currentValue = undoManager.undo();

      if (typeof currentValue === "string") {
        setReport(currentValue);
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.code === "KeyY") {
      e.preventDefault();
      const currentValue = undoManager.redo();

      if (typeof currentValue === "string") {
        setReport(currentValue);
      }
    }
  };

  const getCurrentCursorLineValue = (
    textarea: HTMLTextAreaElement,
    report: string
  ) => {
    const cursorPosition = textarea.selectionStart;
    const currentLineStart = report.lastIndexOf("\n", cursorPosition - 1) + 1;
    const currentLineEnd = report.indexOf("\n", cursorPosition);
    const currentLine = report.slice(
      currentLineStart,
      currentLineEnd !== -1 ? currentLineEnd : undefined
    );

    return currentLine;
  };

  const copyCurrentLine = () => {
    const textarea = textareaRef.current;
    const reportAndNotes = parseReport(report);
    const activities = reportAndNotes[0] || [];
    const lastActivity = activities[activities.length - 1];

    if (textarea) {
      const currentLineValue = getCurrentCursorLineValue(textarea, report);
      const isCursorOnRegistration =
        parseReport(currentLineValue)[0]?.length !== 0;

      if (!isCursorOnRegistration) return;
      const currentLineItems = currentLineValue.split(" - ");

      // forbid copying the end of the day
      if (currentLineItems.length <= 2 && !currentLineItems[1]?.trim()) return;

      const project = currentLineItems[1];
      let activity = "";
      let description = "";

      if (currentLineItems.length === 3) {
        description = currentLineItems[2];
      }

      if (currentLineItems.length === 4) {
        activity = currentLineItems[2];
        description = currentLineItems[3];
      }

      // if user hasn't end of the day
      if (!lastActivity.isBreak) {
        activities.push({
          from: getCurrentTimeRoundedUp(),
          project: project,
          activity: activity,
          description: description,
          to: getCurrentTimeRoundedUp(),
        });
      } else {
        lastActivity.project = project;
        lastActivity.activity = activity;
        lastActivity.description = description;
        lastActivity.to = getCurrentTimeRoundedUp();
      }
    }

    const serializedReport =
      serializeReport(activities) +
      (!reportAndNotes[1] || reportAndNotes[1].startsWith("undefined")
        ? ""
        : reportAndNotes[1]);

    setReportHandler(serializedReport);
  };

  return (
    <div>
      <h2
        id="manual-input-title"
        className="text-lg font-medium text-gray-900 dark:text-dark-heading"
      >
        Manual input
      </h2>

      <textarea
        value={report}
        onChange={(e) => setReportHandler(e.target.value)}
        rows={15}
        className="block w-full px-3 py-2 mt-3 border border-gray-300 rounded-md shadow-sm focus-visible:outline-blue-500 sm:text-sm dark:bg-dark-back dark:border-dark-border dark:text-slate-400 focus-visible:dark:outline-slate-500"
        spellCheck={true}
        ref={textareaRef}
        onKeyDown={textAreaKeyHandler}
      />
      <div className="relative flex flex-col gap-4 mt-6 justify-stretch">
        {showDeleteMessage && (
          <DeleteMessage
            setShowDeleteButton={setShowDeleteButton}
            setShowDeleteMessage={setShowDeleteMessage}
            selectedDate={selectedDate}
            setSelectedDateReport={setSelectedDateReport}
          />
        )}
        <div className="flex flex-col justify-stretch">
          <Button
            text="Save"
            callback={saveReportHandler}
            status={saveBtnStatus}
            disabled={saveBtnStatus === "disabled"}
            type={"button"}
          />
          <span className="block text-xs text-gray-500 text-center">
            or press ctrl + s
          </span>
        </div>
        {showDeleteButton && (
          <button
            onClick={() => setShowDeleteMessage(true)}
            type="button"
            className="inline-flex w-full justify-center rounded-md bg-red-100 px-3 py-2 text-sm font-semibold text-red-800 hover:text-white shadow-sm hover:bg-red-600 sm:w-auto dark:text-dark-heading dark:border dark:border-red-500/50 hover:dark:border-transparent dark:bg-transparent hover:dark:bg-red-400/20"
          >
            Remove an empty file
          </button>
        )}
      </div>
    </div>
  );
}