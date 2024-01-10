import clsx from "clsx";
import { FormEvent, Fragment, useEffect, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import useTimeInput from "../../helpers/hooks/useTimeInput";
import {
  ReportActivity,
  calcDurationBetweenTimes,
  formatDurationAsDecimals,
  addSuggestions,
  addDurationToTime,
} from "../../helpers/utils/reports";
import { checkIsToday, padStringToMinutes } from "../../helpers/utils/datetime-ui";
import { AutocompleteSelector } from "../../shared/AutocompleteSelector";
import { Button } from "../../shared/Button";
import { shallow } from "zustand/shallow";
import { useScheduledEventsStore } from "../../store/googleEventsStore";
import { getJiraCardsFromAPI } from "../../helpers/utils/jira";
import { getAllTrelloCardsFromApi } from "../../helpers/utils/trello";

export type TrackTimeModalProps = {
  activities: Array<ReportActivity> | null;
  isOpen: boolean;
  editedActivity: ReportActivity | "new";
  latestProjAndAct: Record<string, [string]>;
  latestProjAndDesc: Record<string, [string]>;
  close: () => void;
  submitActivity: (
    activity: Omit<ReportActivity, "id"> & Pick<ReportActivity, "id">
  ) => void;
  selectedDate: Date;
};

export default function TrackTimeModal({
  activities,
  isOpen,
  editedActivity,
  latestProjAndAct,
  latestProjAndDesc,
  close,
  submitActivity,
  selectedDate,
}: TrackTimeModalProps) {
  const [from, onFromChange, onFromBlur, setFrom] = useTimeInput();
  const [to, onToChange, onToBlur, setTo] = useTimeInput();
  const [formattedDuration, setFormattedDuration] = useState("");
  const [project, setProject] = useState("");
  const [activity, setActivity] = useState("");
  const [description, setDescription] = useState("");
  const [isTypingFromDuration, setIsTypingFromDuration] = useState(false);
  const [isValidationEnabled, setIsValidationEnabled] = useState(false);
  const [userTrelloTasks, setUserTrelloTasks] = useState([]);
  const [otherTrelloTasks, setOtherTrelloTasks] = useState([]);
  const [userJiraTasks, setUserJiraTasks] = useState([]);
  const [otherJiraTasks, setOtherJiraTasks] = useState([]);
  const [scheduledEvents, setScheduledEvents] = useScheduledEventsStore(
    (state) => [state.event, state.setEvent],
    shallow
  );
  const [latestProjects, setLatestProjects] = useState([]);
  const [webTrackerProjects, setWebTrackerProjects] = useState([]);
  const [uniqueWebTrackerProjects, setUniqueWebTrackerProjects] = useState([]);

  const duration = useMemo(() => {
    if (!from.includes(":") || !to.includes(":")) return null;

    return calcDurationBetweenTimes(from, to);
  }, [from, to]);

  const isFormInvalid = useMemo(() => {
    return (
      !from ||
      !to ||
      !duration ||
      duration < 0 ||
      !project ||
      to.length < 5 ||
      from.length < 5
    );
  }, [from, to, duration, project]);

  const thirdPartyItems = useMemo(() => {
    return [
      ...userTrelloTasks,
      ...userJiraTasks,
      ...otherTrelloTasks,
      ...otherJiraTasks,
    ];
  }, [userTrelloTasks, otherTrelloTasks, userJiraTasks, otherJiraTasks]);

  useEffect(() => {
    if (!editedActivity || editedActivity === "new") {
      resetModal();
      return;
    }

    if (editedActivity?.calendarId) {
      const lastRegistrationTo = activities[activities?.length - 2]?.to;

      padStringToMinutes(lastRegistrationTo) >
      padStringToMinutes(editedActivity?.from)
        ? setFrom(lastRegistrationTo || "")
        : setFrom(editedActivity?.from || "");
    } else {
      setFrom(editedActivity?.from || "");
    }

    setTo(editedActivity.to || "");
    setFormattedDuration(
      formatDurationAsDecimals(editedActivity.duration) || ""
    );
    setProject(editedActivity.project || "");
    setActivity(editedActivity.activity || "");
    setDescription(editedActivity.description || "");
  }, [editedActivity]);

  useEffect(() => {
    if (editedActivity !== "new") {
      return;
    }
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const floorMinutes = (Math.floor(Number(minutes) / 15) * 15)
      .toString()
      .padStart(2, "0");
    const ceilHours = Math.ceil(
      Number(minutes) / 15 > 3 ? Number(hours) + 1 : Number(hours)
    )
      .toString()
      .padStart(2, "0");
    const ceilMinutes = (
      Math.ceil(Number(minutes) / 15 > 3 ? 0 : Number(minutes) / 15) * 15
    )
      .toString()
      .padStart(2, "0");
    const isToday = checkIsToday(selectedDate);

    if (activities?.length && activities[activities?.length - 1].to) {
      setFrom(activities[activities?.length - 1].to);
    } else if (activities.length && !activities[activities?.length - 1].to) {
      setFrom(activities[activities?.length - 1].from);
    } else {
      setFrom(`${hours}:${floorMinutes}`);
    }

    isToday ? setTo(`${ceilHours}:${ceilMinutes}`) : setTo("");
  }, [isOpen]);

  useEffect(() => {
    addSuggestions(activities, latestProjAndDesc, latestProjAndAct);
    const tempLatestProj = Object.keys(latestProjAndAct);

    if (webTrackerProjects) {
      const tempWebTrackerProjects = [];
      for (let i = 0; i < webTrackerProjects.length; i++) {
        if (!tempLatestProj.includes(webTrackerProjects[i])) {
          tempWebTrackerProjects.push(webTrackerProjects[i]);
          global.ipcRenderer.send("dictionaty-update", webTrackerProjects[i]);
        }
      }
      setUniqueWebTrackerProjects(tempWebTrackerProjects);
    }

    setLatestProjects(tempLatestProj);
  }, [isOpen, latestProjAndDesc, latestProjAndAct, webTrackerProjects]);

  useEffect(() => {
    if (duration === null || isTypingFromDuration) return;

    setFormattedDuration(formatDurationAsDecimals(duration));
  }, [from, to]);

  useEffect(() => {
    (async () => {
      const allTrelloCards = await getAllTrelloCardsFromApi();
      setUserTrelloTasks(allTrelloCards[0]);
      setOtherTrelloTasks(allTrelloCards[1]);

      const allJiraCards = await getJiraCardsFromAPI();
      setUserJiraTasks(allJiraCards[0]);
      setOtherJiraTasks(allJiraCards[1]);
    })();

    getTimetrackerYearProjects();
  }, []);

  const getTimetrackerYearProjects = async () => {
    const userInfo = JSON.parse(localStorage.getItem("timetracker-user"));

    if (!userInfo) return;

    const timetrackerCookie = userInfo?.TTCookie;

    try {
      const yearProjects = await global.ipcRenderer.invoke(
        "timetracker:get-projects",
        timetrackerCookie
      );

      if (yearProjects === "invalid_token") {
        const refresh_token = userInfo?.userInfoRefreshToken;

        if (!refresh_token) return;

        const updatedCreds = await global.ipcRenderer.invoke(
          "timetracker:refresh-user-info-token",
          refresh_token
        );

        const updatedIdToken = updatedCreds?.id_token;

        const updatedCookie = await global.ipcRenderer.invoke(
          "timetracker:login",
          updatedIdToken
        );

        const updatedUser = {
          ...userInfo,
          userInfoIdToken: updatedIdToken,
          TTCookie: updatedCookie,
        };

        localStorage.setItem("timetracker-user", JSON.stringify(updatedUser));
        return await getTimetrackerYearProjects();
      }

      const updatedUserInfo = {
        ...userInfo,
        yearProjects: yearProjects,
      };

      localStorage.setItem("timetracker-user", JSON.stringify(updatedUserInfo));

      setWebTrackerProjects(yearProjects);
    } catch (error) {
      console.log(error);
      setWebTrackerProjects(userInfo.yearProjects);
    }
  };

  const onSave = (e: FormEvent | MouseEvent) => {
    e.preventDefault();

    if (isFormInvalid) {
      setIsValidationEnabled(true);
      return;
    }

    let dashedDescription = description;

    if (description.includes(" - ")) {
      setDescription(description.replace(/ - /g, " -- "));
      dashedDescription = description.replace(/ - /g, " -- ");
    }

    submitActivity({
      id: editedActivity === "new" ? null : editedActivity.id,
      from,
      to,
      duration,
      project,
      activity,
      description: dashedDescription,
      calendarId: editedActivity === "new" ? null : editedActivity.calendarId,
    });

    if (
      !scheduledEvents[dashedDescription] &&
      editedActivity !== "new" &&
      editedActivity.calendarId?.length > 0
    ) {
      scheduledEvents[dashedDescription] = { project: "", activity: "" };
    }
    if (
      scheduledEvents[dashedDescription] &&
      !scheduledEvents[dashedDescription].project
    ) {
      scheduledEvents[dashedDescription].project = project;
    }

    if (
      scheduledEvents[dashedDescription] &&
      scheduledEvents[dashedDescription].activity !== activity
    ) {
      scheduledEvents[dashedDescription].activity = activity || "";
    }

    setScheduledEvents(scheduledEvents);

    // if (googleEvents.length > 0 && editedActivity !== "new") {
    //   const arrayWithMarkedActivty = markActivityAsAdded(
    //     googleEvents,
    //     editedActivity
    //   );

    //   const arrayWithPrefilledValue = arrayWithMarkedActivty.map((gEvent) => {
    //     if (gEvent.summary === editedActivity.description) {
    //       if (project) gEvent.project = project;
    //       if (activity) gEvent.activity = activity;
    //     }

    //     return gEvent;
    //   });

    //   localStorage.setItem(
    //     "googleEvents",
    //     JSON.stringify(arrayWithPrefilledValue)
    //   );
    //   setGoogleEvents(arrayWithPrefilledValue);
    // }

    global.ipcRenderer.send("send-analytics-data", "registrations", {
      registration: "time_registrations",
    });
    close();
  };

  const resetModal = () => {
    setFrom("");
    setTo("");
    setFormattedDuration("");
    setProject("");
    setActivity("");
    setDescription("");
    setIsValidationEnabled(false);
  };

  const disableTextDrag = (e) => {
    e.preventDefault();
  };

  const onDurationChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value;
    const formatDurationRegex = /^-?(\d*\.?\d*)?[hm]?$|^-?[hm](?![hm.])$/i;

    if (formatDurationRegex.test(value)) {
      setIsTypingFromDuration(true);
      setFormattedDuration(value);
      setTo(addDurationToTime(from, value));
    }
  };

  const onDurationBlur = () => {
    setIsTypingFromDuration(false);
    setFormattedDuration(formatDurationAsDecimals(duration));
  };

  const selectText = (e) => {
    e.target.select();
  };

  // const addEventToList = (event: Event) => {
  //   const { from, to, project, activity, description } = event;
  //   let dashedDescription = description;
  //   if (description.includes(" - ")) {
  //     setDescription(description.replace(" - ", " -- "));
  //     dashedDescription = description.replace(" - ", " -- ");
  //   }
  //   if (scheduledEvents[dashedDescription]) {
  //     setProject(scheduledEvents[dashedDescription].project);
  //     setActivity(activity || scheduledEvents[dashedDescription].activity);
  //   }
  //   if (!scheduledEvents[dashedDescription]) {
  //     setProject(project || "");
  //     setActivity(activity || "");
  //     scheduledEvents[dashedDescription] = { project: "", activity: "" };
  //     scheduledEvents[dashedDescription].project = project || "";
  //     scheduledEvents[dashedDescription].activity = activity || "";
  //   }

  //   setFrom(from.time || "");
  //   setTo(to.time || "");
  //   setDescription(dashedDescription || "");
  //   setScheduledEvents(scheduledEvents);
  // };

  const handleKey = (
    event: React.KeyboardEvent<HTMLInputElement>,
    callback: (value: string) => void | undefined = undefined
  ) => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();

      if (!callback) return;

      const input = event.target as HTMLInputElement;
      const value = input.value;

      if (value.length < 5) return;

      if (input.selectionStart === 0 && input.selectionEnd === value.length) {
        input.selectionStart = value.length;
        input.selectionEnd = value.length;
      }

      const cursorPosition = input.selectionStart;
      const currentTime = value;
      let [hours, minutes] = currentTime.split(":").map(Number);

      const changeMinutesAndHours = (
        eventKey: string,
        minutes: number,
        hours: number
      ) => {
        let newMinutes = minutes;
        let newHours = hours;

        if (eventKey === "ArrowUp") {
          newMinutes += 15;
        } else if (eventKey === "ArrowDown") {
          newMinutes -= 15;
        }

        if (newMinutes < 0) {
          newHours = changeHours(eventKey, hours);
          newMinutes += 60;
        } else if (newMinutes >= 60) {
          newHours = changeHours(eventKey, hours);
          newMinutes -= 60;
        }

        return [newMinutes, newHours];
      };

      const changeHours = (eventKey: string, hours: number) => {
        let newHours = hours;

        if (eventKey === "ArrowUp") {
          newHours += 1;
        } else if (eventKey === "ArrowDown") {
          newHours -= 1;
        }

        if (newHours < 0) {
          newHours = 23;
        } else if (newHours >= 24) {
          newHours = 0;
        }

        return newHours;
      };

      if (cursorPosition > 2) {
        const [newMinutes, newHours] = changeMinutesAndHours(
          event.key,
          minutes,
          hours
        );
        minutes = newMinutes;
        hours = newHours;
      } else {
        hours = changeHours(event.key, hours);
      }

      const adjustedTime =
        hours.toString().padStart(2, "0") +
        ":" +
        minutes.toString().padStart(2, "0");

      input.value = adjustedTime;
      input.selectionStart = cursorPosition;
      input.selectionEnd = cursorPosition;
      callback(adjustedTime);
    }

    if (event.ctrlKey && event.key === "Enter") {
      event.preventDefault();
      onSave(event);
    }
  };

  return (
    <Transition.Root appear={true} show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        onClose={() => null}
      >
        <div className="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900/80" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <form
              className="relative inline-block px-4 pt-5 pb-4  text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 dark:bg-dark-container dark:border dark:border-dark-border"
              onSubmit={onSave}
            >
              <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                <button
                  type="button"
                  className="text-gray-400 bg-white rounded-md hover:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 dark:bg-transparent"
                  onClick={close}
                  tabIndex={9}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="w-6 h-6" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-3 space-y-6 text-center sm:mt-0 sm:text-left">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-dark-heading"
                >
                  Track time
                </Dialog.Title>
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6 sm:col-span-2">
                    <label
                      htmlFor="from"
                      className="block text-sm font-medium text-gray-700 dark:text-dark-main"
                    >
                      From
                    </label>
                    <input
                      onKeyDown={(event) => handleKey(event, setFrom)}
                      required
                      value={from}
                      onChange={onFromChange}
                      onBlur={onFromBlur}
                      onFocus={selectText}
                      type="text"
                      id="from"
                      tabIndex={1}
                      className={clsx(
                        "block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:border-dark-form-border dark:text-dark-heading dark:bg-dark-form-back focus:dark:border-focus-border focus:dark:ring-focus-border",
                        {
                          "border-red-300 text-red-900 placeholder-red-300 dark:border-red-700/40 dark:text-red-500 dark:placeholder-red-300":
                            isValidationEnabled && (!from || from.length < 5),
                        }
                      )}
                      onDragStart={disableTextDrag}
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-2">
                    <label
                      htmlFor="to"
                      className="block text-sm font-medium text-gray-700 dark:text-dark-main"
                    >
                      To
                    </label>
                    <input
                      onKeyDown={(event) => handleKey(event, setTo)}
                      required
                      value={to}
                      onChange={onToChange}
                      onBlur={onToBlur}
                      onFocus={selectText}
                      type="text"
                      id="to"
                      tabIndex={2}
                      className={clsx(
                        "block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:border-dark-form-border dark:text-dark-heading dark:bg-dark-form-back focus:dark:border-focus-border focus:dark:ring-focus-border",
                        {
                          "border-red-300 text-red-900 placeholder-red-300 dark:border-red-700/40 dark:text-red-500 dark:placeholder-red-300":
                            isValidationEnabled && (!to || to.length < 5),
                        }
                      )}
                      onDragStart={disableTextDrag}
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-2">
                    <label
                      htmlFor="duration"
                      className="block text-sm font-medium text-gray-700 dark:text-dark-main"
                    >
                      Duration
                    </label>
                    <input
                      onKeyDown={(event) => handleKey(event)}
                      onChange={onDurationChange}
                      onBlur={onDurationBlur}
                      onFocus={selectText}
                      value={formattedDuration}
                      type="text"
                      id="duration"
                      tabIndex={3}
                      className={clsx(
                        "block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:border-dark-form-border dark:text-dark-heading dark:bg-dark-form-back focus:dark:border-focus-border focus:dark:ring-focus-border",
                        {
                          "border-red-300 text-red-900 placeholder-red-300 dark:border-red-700/40 dark:text-red-500 dark:placeholder-red-300":
                            isValidationEnabled && (!duration || duration < 0),
                        }
                      )}
                      onDragStart={disableTextDrag}
                    />
                  </div>

                  <div className="col-span-6">
                    <AutocompleteSelector
                      isNewCheck={true}
                      onSave={onSave}
                      title="Project"
                      required
                      availableItems={latestProjects}
                      additionalItems={
                        uniqueWebTrackerProjects ? uniqueWebTrackerProjects : []
                      }
                      selectedItem={project}
                      setSelectedItem={setProject}
                      isValidationEnabled={isValidationEnabled}
                      showedSuggestionsNumber={
                        Object.keys(latestProjAndAct).length
                      }
                      tabIndex={4}
                      spellCheck={false}
                    />
                  </div>
                  <div className="col-span-6">
                    <AutocompleteSelector
                      isNewCheck={true}
                      onSave={onSave}
                      title="Activity"
                      availableItems={
                        latestProjAndAct[project]
                          ? latestProjAndAct[project]
                          : []
                      }
                      selectedItem={activity}
                      setSelectedItem={setActivity}
                      showedSuggestionsNumber={3}
                      tabIndex={5}
                      spellCheck={false}
                    />
                  </div>
                  <div className="col-span-6">
                    <AutocompleteSelector
                      isNewCheck={false}
                      onSave={onSave}
                      title="Description"
                      availableItems={
                        latestProjAndDesc[project]
                          ? latestProjAndDesc[project]
                          : []
                      }
                      additionalItems={thirdPartyItems}
                      selectedItem={description}
                      setSelectedItem={setDescription}
                      showedSuggestionsNumber={3}
                      tabIndex={6}
                      spellCheck={true}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <div className="flex gap-3">
                  {/* <div className="flex gap-3 justify-start">
                    {checkIsToday(selectedDate) &&
                      (loggedGoogleUsers?.length > 0 ||
                        office365Users?.length > 0) && (
                        <AddEventBtn
                          addEvent={addEventToList}
                          availableProjects={
                            latestProjAndAct
                              ? Object.keys(latestProjAndAct)
                              : []
                          }
                        />
                      )}
                  </div> */}
                  <div className="flex gap-3">
                    <Button
                      text="Cancel"
                      type={"button"}
                      callback={close}
                      status={"cancel"}
                      tabIndex={8}
                    />
                    <Button
                      text="Save"
                      type={"submit"}
                      status={"enabled"}
                      tabIndex={7}
                    />
                  </div>
                </div>
              </div>
            </form>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}