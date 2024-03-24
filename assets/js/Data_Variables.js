// Global Variables
const mainMenuDiv = document.querySelector(".main-menu");
const loadingDiv = document.querySelector(".loading");
const loadingBar = document.querySelector(".loading-bar");

const canvas = document.getElementById("gameCanvas");
const textDiv = document.querySelector(".text-content");
const countdownDiv = document.querySelector(".countdown");
const endingDiv = document.querySelector(".ending-screen");
const statsPs = document.querySelectorAll(".stats");
let TEXT, index, ih;
let scene0, renderer, controls, clock, stats, gui;
let camera0, openingCamera, finishCamera, primaryCamera;
let time = 0,
  difficulty;
let textureLoader, cubeTextureLoader, gltfLoader;
let Textures = {
  skyBox: null,
  enemyCharacter_COL: null,
};
let Lights = [];
let shadows = false;

let info = {},
  helper1,
  helper2,
  lightCamRange;
let tracksEmitter;
let car2, car1; // car2 is the player car
let flagShader, grassShader;

let gameState = {
  START: false,
  typingAllowed: false,
  startAnimation: true,
  loadingAssets: true,
  stats: {
    time: 0,
    accuracy: 0,
    GWAM: 0,
    characters: 0,
    mistakes: 0,
  },
  startingTime: 0,
  correct: true,
};

const ANIMATION_END = 15.2;
const SPEED_FALLOFF_PERCENTAGE = 0.998; // 0.9998 is too little
const SPEED_FALLOFF_CONST = 0.02 / 60;
const MINIMUM_SPEED = 0.15;
const STARTING_BONUSES = [0.2, 0.1, 0.08, 0.05, 0.03];
const CHAR_INCREMENT = 0.015;
const MISTAKE_DECREMENT = 0.02;

const DIFFICULTY_LEVELS = [
  {
    name: "NOOB",
    ENEMY_STARTING_SPEED: 0.13,
    ENEMY_MAX_SPEED: 0.26,
    ENEMY_SPEEDING_UP_TIME: 10, // 60 seconds
  },
  {
    name: "EASY",
    ENEMY_STARTING_SPEED: 0.15,
    ENEMY_MAX_SPEED: 0.4,
    ENEMY_SPEEDING_UP_TIME: 8, // 40 seconds
  },
  {
    name: "NORMAL",
    ENEMY_STARTING_SPEED: 0.25,
    ENEMY_MAX_SPEED: 0.45,
    ENEMY_SPEEDING_UP_TIME: 5, // 35 seconds
  },
  {
    name: "HARD",
    ENEMY_STARTING_SPEED: 0.2,
    ENEMY_MAX_SPEED: 0.6,
    ENEMY_SPEEDING_UP_TIME: 14, // 30 seconds
  },
  {
    name: "ADVANCED",
    ENEMY_STARTING_SPEED: 0.5,
    ENEMY_MAX_SPEED: 0.8,
    ENEMY_SPEEDING_UP_TIME: 7, //20 seconds
  },
];

const NOOB_TEXTS = [
  `aa bb cc dd ee ff gg hh ii jj kk ll mm nn oo pp qq rr ss tt uu vv ww xx yy zz jjj uuu ccc lll rrr www vvv sss aaa iii ddd eee hhh mmm nnn uuu ooo bbb qqq ppp hhh ttt xxx lll rrr zzz ccc eee yyy ggg sss ppp ddd ttt jjj`,
  `j f u r k d e i c g n j r d k u f e j i g n c r ab ae ah ai al am as a ba be i bo eh el em es ha h hi hm il is it la le li o ma me mi mo oe j f u r k d e i c g n j r d k u f e j i g n c r ab ae ah ai al am as a ba be i bo eh el em es ha h hi hm il is it la le li o ma me mi mo oe`,
  `kkd ddk asd das fas lki wel iop cvk qzl zyt mn cat dog sun pen cup bus joy lip car leg arm run sky eye ear red one ten key rat zoo yet pop fan cord bye tea hip son dad mom tap rap lag bad rad was him her tom six two nil`,
];

const EASY_TEXTS = [
  `cats are soft and cute. they purr when glad. a cats whiskers help with poise. cats have sharp claws. they are agile and sly pets. feline eyes gleam in moonlight. silently stalking. ready to leap gracefully. a cats fur is a velvety coat. conceals its lithe frame. nocturnal hunters. nimble paws pounce swiftly. capturing elusive prey. a cats tail. a graceful balance.`,
  `dogs are loyal mates. they bark for care. dogs have a keen scent. breeds vary in size. dogs have been pals for ages. furry tails wag joyfully. welcoming their owners. providing endless affection and warmth. paws patter eagerly. excitement is shown. eyes gleam with loyalty. fur a soft haven. walks become adventures. pawprints marking shared paths.`,
  `birds fly in the sky. feathers aid their flight. some birds mimic speech. nests hold tiny eggs. flying is a birds trait. melodies fill air. harmonizing with nature. echoing through the treetops. a symphony of avian serenades. sunlight dances on vibrant plumage. wind carries them over vast landscapes. migratory journeys cross continents. destinations guided by maps.`,
  `ants work in groups. they are strong bugs. ants chat through scents. they lug big loads. ants aid in nature. diligent workers march. following pheromone trails. building detailed tunnels. natures architects at their tiny scale. ants construct intricate nests. creating cities. they forage for food. harvesting resources with determination. ants communicate through dances. their teamwork is amazing.to collaborate to overcome challenges and ensure survival of the colony.`,
  `the bee is small and flies. it makes honey. bees work hard. they live in hives. bees are good for plants. buzzing wings hum. pollinating blossoms. a sweet dance of nature. orchestrating the cycle of life in blooming meadows. they go to vibrant petals and collect nectar. with fuzzy bodies dusted in golden pollen. bees transfer life from bloom to bloom. working with the winds they navigate the intricate dance of nature.`,
];

const TEXTS = [
  `Auto racing, also known as car racing, is a motorsport involving the racing of automobiles for competition. It has existed since the invention of the automobile. Races of various sorts were organised, with the first recorded as early as 1867. Many of the earliest events were effectively reliability trials, aimed at proving these new machines were a practical mode of transport, but soon became an important way for competing makers to demonstrate their machines.`,
  `Bees are hardwired to do certain jobs. Scout bees, which search for new sources of food, are wired for adventure. Soldier bees, discovered in 2012, work as security guards their whole life. One percent of all middle-aged bees become undertakers - a genetic brain pattern compels them to remove dead bees from the hive. But most amazingly, regular honeybees, which perform multiple jobs in their lifetime, will change their brain chemistry before taking up a new gig.`,
  `Created thousands of years ago, Greek myths were epic stories about Greek gods, passed down over generations. They often feature heroic battles and terrible creatures, and taught the importance of bravery, intelligence, and right and wrong. They showed that even the gods, like mortal men, could be punished or rewarded for their actions. Details of the ancient tales have been found on everything from pottery to temples to stone statues!`,
  `Christopher Columbus was an Italian explorer, navigator, and colonist who completed four voyages across the Atlantic Ocean. He led the first European expeditions to the Caribbean, Central America, and South America. Columbus discovered the viable sailing route to the Americas, a continent which was not then known to the Old World. While what he thought he saw was Far East, he is credited with the opening of the Americas for conquest and settlement by Europeans.`,
  `Plato was a philosopher in Classical Greece and the founder of the Academy in Athens, the first institution of higher learning in the Western world. He was the innovator of the written dialogue and dialectic forms in philosophy. Plato also appears to have been the founder of Western political philosophy. He is widely considered the pivotal figure in the history of Ancient Greek and Western philosophy, along with his teacher, Socrates, and his most famous student, Aristotle.`,
  `Guinea pigs are large rodents. They typically live an average of four to five years, but may live as long as eight years. Guinea pigs can learn complex paths to food, and can accurately remember a learned path for months. Their strongest problem solving strategy is motion. While guinea pigs can jump small obstacles, they cannot climb, and are not particularly agile. They startle extremely easily, and will either freeze in place for long periods or run for cover with rapid, darting motions when they sense danger.`,
  `Explore the ancient wonders of Egypt, where the Great Sphinx, a colossal limestone monument with the body of a lion and the head of a pharaoh, guards the Giza Plateau. Carved around 4,500 years ago, its mysteries continue to captivate historians and archeologists. Uncover the enigmatic allure of this iconic structure, standing as a testament to the rich cultural and architectural legacy of ancient civilizations, leaving us to ponder the secrets of the past.`,
  `Delve into the intriguing world of octopuses, known for their remarkable intelligence and problem-solving skills. Uncover the astonishing abilities of these cephalopods, from their shape-shifting camouflage to their adept use of tools, challenging preconceptions about the limits of animal cognition. Explore the depths of the ocean to witness the extraordinary behaviors that make octopuses one of nature's most fascinating and enigmatic creatures.`,
  `Journey back to the Renaissance era and discover the timeless genius of Leonardo da Vinci. Unravel the multifaceted brilliance of this polymath-artist, inventor, and scientist. From iconic paintings like the Mona Lisa to revolutionary inventions such as the flying machine, delve into the life of da Vinci and his unparalleled contributions that bridged art and science, leaving an indelible mark on human history.`,
  `Step into the mythical realm of Norse mythology, where gods, giants, and legendary creatures shape the tapestry of ancient Scandinavian lore. Explore the grandeur of Asgard, home to deities like Odin and Thor, and the perilous realms of giants and monsters. Unearth the rich narratives of creation, heroic exploits, and the impending Ragnarok, a cataclysmic event that foretells the end of the world in this captivating exploration of Norse myths.`,
  `Embark on a virtual journey to the lost city of Atlantis, a mythical civilization shrouded in mystery. Uncover the enduring allure of this enigmatic city, said to have vanished beneath the waves in a catastrophic event. While scholars debate its historicity, delve into the various theories and legends surrounding Atlantis, from advanced ancient technology to connections with extraterrestrial beings, and ponder the enduring fascination with this legendary utopia.`,
];
