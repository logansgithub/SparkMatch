import { QuestionPack, QuestionPackMeta } from "./types";

export const DEFAULT_PACK_ID = "house-party";

/**
 * Curated multi-event Question Packs for SparkMatch.
 * Each pack contains 12 balanced questions (6 scale 1..5 + 6 choice 0..3)
 * tuned for Polarized Stance Mapping and rarity-weighted match insights.
 */
export const QUESTION_PACKS: QuestionPack[] = [
  {
    id: "house-party",
    title: "House Party Chaos",
    subtitle: "Default Party Deck",
    icon: "Flame",
    accentColor: "#FF5A5F",
    description:
      "Absurd debates, food crimes, zombie survival, and unhinged hypotheticals.",
    questions: [
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
    ],
  },
  {
    id: "work-offsite",
    title: "Work & Team Offsite",
    subtitle: "SFW Corporate Icebreaker",
    icon: "Briefcase",
    accentColor: "#4F46E5",
    description:
      "Meeting pet peeves, Slack etiquette, caffeine habits, and travel styles.",
    questions: [
      {
        id: "w1",
        type: "choice",
        prompt: "Which workplace meeting habit drives you up the wall fastest?",
        options: [
          "A 45-minute call that could've been an email",
          "\"Quick question\" at 4:58pm on Friday",
          "Someone sharing the wrong screen tab",
          "Endless \"let's circle back\" loops",
        ],
        topicTag: "Meeting Pet Peeve",
      },
      {
        id: "w2",
        type: "scale",
        prompt: "Camera on vs. camera off for morning team video calls?",
        lowLabel: "Strictly camera off",
        highLabel: "Ring light ready",
        topicTag: "Camera Etiquette",
      },
      {
        id: "w3",
        type: "choice",
        prompt: "What is your true Slack / Teams messaging personality?",
        options: [
          "One structured essay with bullet points",
          "Seven tiny messages in a row",
          "Communicates almost purely in emoji",
          "Sends \"hey\" and disappears for an hour",
        ],
        topicTag: "Slack Etiquette",
      },
      {
        id: "w4",
        type: "scale",
        prompt: "How strongly does your productivity depend on morning coffee or tea?",
        lowLabel: "Pure water powered",
        highLabel: "Functionally espresso",
        topicTag: "Caffeine Dependency",
      },
      {
        id: "w5",
        type: "choice",
        prompt: "A huge cross-team project launches tomorrow. What role do you claim?",
        options: [
          "The Roadmap Architect",
          "The Slide Deck Polisher",
          "The Last-Minute Firefighter",
          "The Demo Day Storyteller",
        ],
        topicTag: "Project Role",
      },
      {
        id: "w6",
        type: "scale",
        prompt: "Where do you fall on the Inbox Zero spectrum?",
        lowLabel: "14,000 unread & thriving",
        highLabel: "Zero unread at all times",
        topicTag: "Inbox Zero",
      },
      {
        id: "w7",
        type: "choice",
        prompt: "What is your airport travel style for a work trip?",
        options: [
          "3 hours early with coffee & laptop out",
          "Walk straight onto boarding group 1",
          "Brisk power-walk through terminal B",
          "Gate agent practically knows my name",
        ],
        topicTag: "Work Travel Style",
      },
      {
        id: "w8",
        type: "scale",
        prompt: "Opening a call with 5 minutes of small talk vs. diving right into the agenda?",
        lowLabel: "Straight to business",
        highLabel: "Tell me about your weekend",
        topicTag: "Meeting Small Talk",
      },
      {
        id: "w9",
        type: "choice",
        prompt: "Pick your dream team offsite activity:",
        options: [
          "Fiercely competitive trivia night",
          "Hands-on cooking class or food tour",
          "High-pressure escape room",
          "Low-key coffee walk & good chat",
        ],
        topicTag: "Offsite Activity",
      },
      {
        id: "w10",
        type: "scale",
        prompt: "Deep-focus music/podcasts while working vs. absolute library silence?",
        lowLabel: "Total silence only",
        highLabel: "Full soundtrack all day",
        topicTag: "Focus Soundtrack",
      },
      {
        id: "w11",
        type: "choice",
        prompt: "A mysterious 30-minute calendar invite with no agenda lands. First move?",
        options: [
          "Accept immediately, live dangerously",
          "DM the organizer for background intel",
          "Tentative until an agenda appears",
          "Show up caffeinated and improvise",
        ],
        topicTag: "Mystery Invite",
      },
      {
        id: "w12",
        type: "scale",
        prompt: "How confident are you giving an improvised 10-minute presentation with zero prep?",
        lowLabel: "Instant stage fright",
        highLabel: "Hand me the clicker",
        topicTag: "Improv Keynote",
      },
    ],
  },
  {
    id: "late-night",
    title: "Late Night & Unhinged",
    subtitle: "Close Friends Edition",
    icon: "Moon",
    accentColor: "#9333EA",
    description:
      "Petty dealbreakers, 2am conspiracy spirals, and chaotic moral compasses.",
    questions: [
      {
        id: "l1",
        type: "choice",
        prompt: "Which completely petty habit is an instant dealbreaker for you?",
        options: [
          "Leaving 0:01 on the microwave timer",
          "Never closing 200 browser tabs",
          "Casually spoiling shows you're watching",
          "Chewing crunchy snacks on speakerphone",
        ],
        topicTag: "Petty Dealbreaker",
      },
      {
        id: "l2",
        type: "scale",
        prompt: "How deep down a 2am conspiracy rabbit hole are you willing to tumble?",
        lowLabel: "Hard-nosed skeptic",
        highLabel: "Red yarn on the wall",
        topicTag: "2am Conspiracies",
      },
      {
        id: "l3",
        type: "choice",
        prompt: "You spot an unlocked briefcase with $50k in an empty park at midnight. Your move?",
        options: [
          "Turn it straight in to the authorities",
          "Keep walking — clearly a movie trap",
          "Peek inside, panic, then sprint home",
          "Ask zero questions and vanish",
        ],
        topicTag: "Midnight Briefcase",
      },
      {
        id: "l4",
        type: "scale",
        prompt: "How long can you hold a petty grudge over a minor betrayal?",
        lowLabel: "Forgiven in 10 minutes",
        highLabel: "Carried to the grave",
        topicTag: "Petty Grudges",
      },
      {
        id: "l5",
        type: "choice",
        prompt: "Which irrational everyday annoyance instantly spikes your blood pressure?",
        options: [
          "People clapping when the plane lands",
          "Slow walkers forming a sidewalk wall",
          "Unsolicited 4-minute voice notes",
          "Reply-all chaos on group threads",
        ],
        topicTag: "Irrational Pet Peeve",
      },
      {
        id: "l6",
        type: "scale",
        prompt: "Embellishing a true story slightly just to make it 10x funnier?",
        lowLabel: "Sworn courtroom truth",
        highLabel: "Cinema over accuracy",
        topicTag: "Story Embellishment",
      },
      {
        id: "l7",
        type: "choice",
        prompt: "You get 60 seconds to read every group chat's messages about you. Do you look?",
        options: [
          "Immediately, zero hesitation",
          "Only to see who defends me",
          "Never — protect my peace",
          "Skim and take mental notes",
        ],
        topicTag: "Secret Group Chat",
      },
      {
        id: "l8",
        type: "scale",
        prompt: "Deliberately waiting to reply to a text so you don't look too available?",
        lowLabel: "Zero games, reply now",
        highLabel: "Strategic 42-min delay",
        topicTag: "Texting Mind Games",
      },
      {
        id: "l9",
        type: "choice",
        prompt: "Which chaotic superpower would ruin your life fastest?",
        options: [
          "Hearing pets' brutally honest thoughts",
          "Always knowing when someone lies",
          "Rewinding 30 seconds once a day",
          "Teleporting, but only 15 feet",
        ],
        topicTag: "Chaotic Superpower",
      },
      {
        id: "l10",
        type: "scale",
        prompt: "Instantly judging someone whose phone battery is constantly under 5%?",
        lowLabel: "Live on the edge, respect",
        highLabel: "Deeply untrustworthy",
        topicTag: "Low Battery Energy",
      },
      {
        id: "l11",
        type: "choice",
        prompt: "The self-checkout machine glitches and misses scanning a $3 snack. Moral compass check?",
        options: [
          "Wave down the attendant every time",
          "Re-scan it twice out of pure guilt",
          "Freeze, panic, and walk out fast",
          "Call it an unpaid cashier wage",
        ],
        topicTag: "Self-Checkout Ethics",
      },
      {
        id: "l12",
        type: "scale",
        prompt: "Dropping a spicy hot take at dinner just to watch the table erupt into debate?",
        lowLabel: "Certified peacekeeper",
        highLabel: "Pass the popcorn",
        topicTag: "Dinner Chaos",
      },
    ],
  },
  {
    id: "campfire",
    title: "Campfire & Deep Cuts",
    subtitle: "Thoughtful & Nostalgic",
    icon: "Compass",
    accentColor: "#059669",
    description:
      "Road trip aux rules, nostalgia, bucket-list trips, and midnight diner talks.",
    questions: [
      {
        id: "c1",
        type: "choice",
        prompt: "What is the sacred rule for controlling the road trip aux cord?",
        options: [
          "Driver holds absolute veto power",
          "Shotgun DJ curates the full vibe",
          "Strict one-song democratic queue",
          "Front-to-back classic albums only",
        ],
        topicTag: "Road Trip Aux",
      },
      {
        id: "c2",
        type: "scale",
        prompt: "How nostalgic are you for the music and movies of your teenage years?",
        lowLabel: "Always chasing what's new",
        highLabel: "Forever in that era",
        topicTag: "Teenage Nostalgia",
      },
      {
        id: "c3",
        type: "choice",
        prompt: "It is 11:30pm at a glowing retro diner. What are you ordering?",
        options: [
          "Tall stack of pancakes & hash browns",
          "Crispy fries & a thick milkshake",
          "Breakfast burrito & bottomless coffee",
          "Warm slice of pie & good conversation",
        ],
        topicTag: "Late-Night Diner",
      },
      {
        id: "c4",
        type: "scale",
        prompt: "If you got one weekend pass: revisit the past or peek 50 years into the future?",
        lowLabel: "Revisit the past",
        highLabel: "Peek into the future",
        topicTag: "Past vs. Future",
      },
      {
        id: "c5",
        type: "choice",
        prompt: "Pick the bucket-list trip you would book tomorrow:",
        options: [
          "Sleeper train across a continent",
          "Stargazing in a silent desert",
          "A stormy cottage by the ocean",
          "A month abroad learning a craft",
        ],
        topicTag: "Bucket-List Trip",
      },
      {
        id: "c6",
        type: "scale",
        prompt: "Mapping every stop of a trip vs. wandering with zero itinerary?",
        lowLabel: "Color-coded spreadsheet",
        highLabel: "Follow the coolest street",
        topicTag: "Travel Planning",
      },
      {
        id: "c7",
        type: "choice",
        prompt: "Which era would you spend one unforgettable week visiting?",
        options: [
          "Roaring 1920s jazz clubs",
          "Golden-hour 1970s coast drive",
          "Pre-smartphone 1990s summer",
          "A far-future orbital city",
        ],
        topicTag: "Favorite Era",
      },
      {
        id: "c8",
        type: "scale",
        prompt: "Big buzzing house gatherings vs. quiet three-person porch conversations?",
        lowLabel: "Big energetic crowd",
        highLabel: "Quiet porch deep talk",
        topicTag: "Social Battery",
      },
      {
        id: "c9",
        type: "choice",
        prompt: "Your ideal rainy Sunday with zero obligations:",
        options: [
          "Cozy movie marathon under blankets",
          "Cooking an ambitious slow-simmer meal",
          "Getting lost in a used bookstore",
          "Long scenic drive with great playlists",
        ],
        topicTag: "Rainy Sunday",
      },
      {
        id: "c10",
        type: "scale",
        prompt: "Keeping physical keepsakes (ticket stubs, letters, photos) vs. traveling light?",
        lowLabel: "Minimalist, toss it all",
        highLabel: "Archival memory box",
        topicTag: "Memory Keeper",
      },
      {
        id: "c11",
        type: "choice",
        prompt: "What instantly makes a space feel like home to you?",
        options: [
          "Warm lamp light & cozy corners",
          "A big kitchen table with snacks",
          "Soft vinyl or music in the background",
          "Wide-open windows & fresh air",
        ],
        topicTag: "Feels Like Home",
      },
      {
        id: "c12",
        type: "scale",
        prompt: "How easily do you strike up a real conversation with a total stranger?",
        lowLabel: "Headphones firmly on",
        highLabel: "New friend in every line",
        topicTag: "Stranger Chats",
      },
    ],
  },
];

const PACK_MAP = new Map<string, QuestionPack>(
  QUESTION_PACKS.map((pack) => [pack.id, pack])
);

export function getQuestionPack(packId: string): QuestionPack | undefined {
  return PACK_MAP.get(packId);
}

export function getQuestionPackOrDefault(packId: string): QuestionPack {
  return PACK_MAP.get(packId) ?? QUESTION_PACKS[0];
}

export function toPackMeta(pack: QuestionPack): QuestionPackMeta {
  return {
    id: pack.id,
    title: pack.title,
    subtitle: pack.subtitle,
    icon: pack.icon,
    accentColor: pack.accentColor,
    description: pack.description,
    questionCount: pack.questions.length,
  };
}

export function getPublicPackMetas(): QuestionPackMeta[] {
  return QUESTION_PACKS.map(toPackMeta);
}
