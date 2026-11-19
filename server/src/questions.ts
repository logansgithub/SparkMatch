import { Question } from "./types";

/**
 * SparkMatch Question Bank
 *
 * Easily customize your party quiz by editing the array below!
 * - "scale" questions use integer answers 1..5 with `lowLabel` and `highLabel`.
 * - "choice" questions use 4 options indexed 0..3 in `options`.
 * - `topicTag` is a short label displayed on the final Match Reveal card.
 */
export const QUESTIONS: Question[] = [
  {
    id: "q1",
    type: "choice",
    prompt: "A zombie apocalypse starts tonight. What is your survival role?",
    options: [
      "Over-prepared bunker CEO",
      "Tries to befriend the zombies",
      "Sacrifices self for snacks",
      "Somehow sleeps right through it",
    ],
    topicTag: "Zombie Apocalypse",
  },
  {
    id: "q2",
    type: "scale",
    prompt: "Pineapple on pizza — where do you stand?",
    lowLabel: "Culinary Crime",
    highLabel: "Peak Gastronomy",
    topicTag: "Pineapple on Pizza",
  },
  {
    id: "q3",
    type: "choice",
    prompt: "Be honest: what is your real texting reply speed?",
    options: [
      "Instant reply (chronically online)",
      "3 to 5 business days",
      "Replied mentally, forgot IRL",
      "A chaotic 6-minute voice note",
    ],
    topicTag: "Texting Speed",
  },
  {
    id: "q4",
    type: "scale",
    prompt:
      "You spot a suspiciously polite raccoon in an alley. How likely are you to try befriending it?",
    lowLabel: "Sprint away immediately",
    highLabel: "New best friend",
    topicTag: "Alley Raccoon",
  },
  {
    id: "q5",
    type: "choice",
    prompt: "Your friend group plans a museum heist. What is your crew role?",
    options: [
      "The Mastermind",
      "The Getaway Driver",
      "The Tech Hacker",
      "The Chaotic Distraction",
    ],
    topicTag: "Heist Crew Role",
  },
  {
    id: "q6",
    type: "scale",
    prompt:
      "How strong is your commitment to the Irish Goodbye (vanishing from a party without telling anyone)?",
    lowLabel: "Hug every single person",
    highLabel: "Ghost into the night",
    topicTag: "Irish Goodbye",
  },
  {
    id: "q7",
    type: "scale",
    prompt: "How gracefully would you survive 24 hours without your phone?",
    lowLabel: "Immediate existential panic",
    highLabel: "Unbothered zen monk",
    topicTag: "No-Phone Survival",
  },
  {
    id: "q8",
    type: "choice",
    prompt: "It is your turn at karaoke. What is the game plan?",
    options: [
      "Unhinged duet with a stranger",
      "Tear-jerking power ballad",
      "Full-room crowd hype anthem",
      "Hiding silently in the back",
    ],
    topicTag: "Karaoke Strategy",
  },
  {
    id: "q9",
    type: "scale",
    prompt:
      "Someone is loudly wrong on the internet. How likely are you to argue with them in the comments?",
    lowLabel: "Keep scrolling peacefully",
    highLabel: "Writing a 4-paragraph essay",
    topicTag: "Internet Debates",
  },
  {
    id: "q10",
    type: "choice",
    prompt: "You just won $10 million. What is your very first move?",
    options: [
      "Build a secret underground lair",
      "Book endless first-class travel",
      "Adopt a ridiculously exotic pet",
      "Disappear quietly to a cabin",
    ],
    topicTag: "$10M Windfall",
  },
  {
    id: "q11",
    type: "choice",
    prompt: "How early do you actually arrive at the airport?",
    options: [
      "4 hours early, relaxing at the gate",
      "Right as boarding begins",
      "Full Olympic sprint through TSA",
      "Pure unscheduled chaos",
    ],
    topicTag: "Airport Timing",
  },
  {
    id: "q12",
    type: "scale",
    prompt:
      "How confident are you that you could safely land a commercial plane in an emergency?",
    lowLabel: "We are doomed",
    highLabel: "Put me in the cockpit",
    topicTag: "Landing a Plane",
  },
];
