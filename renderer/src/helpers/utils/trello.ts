import { replaceHyphensWithSpaces } from "./utils";

type Card = {
  id: string;
  name: string;
  shortUrl: string;
  idMembers: string[];
};

export const getAllTrelloCardsFromApi = async () => {
  const user = JSON.parse(localStorage.getItem("trello-user")) || null;

  if (!user) return [[], []];

  try {
    const { assignedCards, notAssignedCards } = await global.ipcRenderer.invoke(
      "trello:get-cards-of-all-boards",
      user.userId,
      user.accessToken
    );

    const assignedTrelloCards = assignedCards
      .map((card: Card) =>
        replaceHyphensWithSpaces(`TT:: ${card.name} ${card.shortUrl}`)
      )
      .sort((a: string, b: string) => a.localeCompare(b));
    const notAssignedTrelloCards = notAssignedCards
      .map((card: Card) =>
        replaceHyphensWithSpaces(`TT:: ${card.name} ${card.shortUrl}`)
      )
      .sort((a: string, b: string) => a.localeCompare(b));

    return [assignedTrelloCards, notAssignedTrelloCards];
  } catch (error) {
    console.log(
      "Try to re-login to Trello or check your internet connection",
      error
    );
    return [[], []];
  }
};