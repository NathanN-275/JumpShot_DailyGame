const letterKey = (value) => value.normalize("NFD").toLowerCase().replace(/[^a-z]/g, "");

const NAME_ALIASES = {
  "Stephen Curry": ["Steph Curry", "Steph"],
  "LeBron James": ["LeBron"],
  "Michael Jordan": ["Jordan", "MJ"],
  "Kobe Bryant": ["Kobe"],
  "Shaquille O'Neal": ["Shaq", "Shaquille Oneal"],
  "Jermaine O'Neal": ["Jermaine Oneal"],
  "Kareem Abdul-Jabbar": ["Kareem", "Lew Alcindor"],
  "Giannis Antetokounmpo": ["Giannis", "Greek Freak"],
  "Nikola Jokic": ["Jokic", "Joker"],
  "Luka Doncic": ["Luka"],
  "Kevin Durant": ["KD"],
  "Russell Westbrook": ["Russ", "Westbrook"],
  "Shai Gilgeous-Alexander": ["Shai", "SGA"],
  "Victor Wembanyama": ["Wemby"],
  "Damian Lillard": ["Dame", "Dame Lillard"],
  "Dwyane Wade": ["D Wade"],
  "Allen Iverson": ["AI"],
  "Magic Johnson": ["Magic", "Earvin Johnson"],
  "Hakeem Olajuwon": ["Hakeem"],
  "Manu Ginobili": ["Manu"],
  "Vince Carter": ["Vince", "Vinsanity"],
  "Tracy McGrady": ["T-Mac", "TMac"],
  "Ron Artest": ["Metta World Peace"],
  "Isaiah Rider": ["Isiah Rider", "J.R. Rider", "JR Rider"],
  "J.R. Smith": ["JR Smith", "J R Smith"],
  "C.J. McCollum": ["CJ McCollum", "C J McCollum"],
};

const HEADLINERS = new Set([
  "Michael Jordan", "LeBron James", "Kobe Bryant", "Stephen Curry", "Shaquille O'Neal",
  "Magic Johnson", "Larry Bird", "Kevin Durant", "Giannis Antetokounmpo", "Nikola Jokic",
  "Luka Doncic", "Victor Wembanyama", "Shai Gilgeous-Alexander", "Allen Iverson",
  "Kareem Abdul-Jabbar", "Wilt Chamberlain", "Bill Russell", "Tim Duncan", "Hakeem Olajuwon",
  "Anthony Edwards", "Jayson Tatum", "Joel Embiid", "James Harden", "Russell Westbrook",
  "Carmelo Anthony", "Chris Paul", "Charles Barkley", "Dwyane Wade", "Dirk Nowitzki",
  "Kyrie Irving", "Kevin Garnett", "Scottie Pippen", "Damian Lillard", "Derrick Rose",
  "Ja Morant", "Jalen Brunson", "Vince Carter", "Anthony Davis", "Devin Booker", "Kawhi Leonard",
].map(letterKey));

const FAMILIAR_NAMES = new Set([
  "Oscar Robertson", "Jerry West", "Karl Malone", "John Stockton", "David Robinson", "Reggie Miller",
  "Ray Allen", "Paul Pierce", "Steve Nash", "Jason Kidd", "Patrick Ewing", "Tracy McGrady",
  "Dominique Wilkins", "Dennis Rodman", "Klay Thompson", "Jimmy Butler", "Dwight Howard",
  "Blake Griffin", "Jamal Murray", "DeMar DeRozan", "Zion Williamson", "LaMelo Ball", "Trae Young",
  "Donovan Mitchell", "Cade Cunningham", "Jaylen Brown", "Tyrese Haliburton", "Zach LaVine",
  "Bam Adebayo", "Draymond Green", "Pau Gasol", "Manu Ginobili", "Tony Parker", "Paul George",
  "Ben Wallace", "Chauncey Billups", "Ben Simmons", "Chet Holmgren", "Cooper Flagg", "Paolo Banchero",
  "Jaren Jackson Jr.", "Pascal Siakam", "Julius Randle", "Rudy Gobert", "Karl-Anthony Towns",
].map(letterKey));

const aliasesByPlayer = new Map(Object.entries(NAME_ALIASES).map(([name, aliases]) => [letterKey(name), aliases]));
const nbaNames = NBA_PLAYER_DIRECTORY.map(([first, last, active, display]) => {
  const name = display ?? `${first} ${last}`.trim();
  const full = letterKey(name);
  const tier = HEADLINERS.has(full) ? "dunk" : FAMILIAR_NAMES.has(full) ? "jumpshot" : active ? "three" : "half";
  return { first: letterKey(first), last: letterKey(last), full, answer: [name, tier, aliasesByPlayer.get(full)] };
});
const KNOWN_NAME_KEYS = new Set(nbaNames.map(({ full }) => full));

function nameQuestion(prompt, qualifies) {
  return {
    prompt,
    hint: "Current and former NBA players count. Use their full name.",
    nameRule: true,
    answers: nbaNames.filter(qualifies).map((player) => player.answer),
  };
}

const NAME_QUESTIONS = [
  nameQuestion("Name an NBA player with an O in their name.", ({ full }) => full.includes("o")),
  nameQuestion("Name an NBA player with an A in their name.", ({ full }) => full.includes("a")),
  nameQuestion("Name an NBA player with an E in their name.", ({ full }) => full.includes("e")),
  nameQuestion("Name an NBA player with a K in their name.", ({ full }) => full.includes("k")),
  nameQuestion("Name an NBA player whose first name starts with J.", ({ first }) => first.startsWith("j")),
  nameQuestion("Name an NBA player whose first name starts with M.", ({ first }) => first.startsWith("m")),
  nameQuestion("Name an NBA player whose first name starts with D.", ({ first }) => first.startsWith("d")),
  nameQuestion("Name an NBA player whose last name starts with B.", ({ last }) => last.startsWith("b")),
  nameQuestion("Name an NBA player whose last name ends in N.", ({ last }) => last.endsWith("n")),
  nameQuestion("Name an NBA player with a double letter in their first or last name.", ({ first, last }) =>
    /([a-z])\1/.test(first) || /([a-z])\1/.test(last)),
];

const TEAM_ALIASES = {
  "Los Angeles Lakers": ["Lakers", "LA Lakers"],
  "Boston Celtics": ["Celtics"],
  "Philadelphia 76ers": ["76ers", "Sixers"],
  "Detroit Pistons": ["Pistons"],
  "Chicago Bulls": ["Bulls"],
  "Houston Rockets": ["Rockets"],
  "San Antonio Spurs": ["Spurs"],
  "Miami Heat": ["Heat"],
  "Dallas Mavericks": ["Mavericks", "Mavs"],
  "Golden State Warriors": ["Warriors", "GSW"],
  "Cleveland Cavaliers": ["Cavaliers", "Cavs"],
  "Toronto Raptors": ["Raptors"],
  "Milwaukee Bucks": ["Bucks"],
  "Denver Nuggets": ["Nuggets"],
  "Oklahoma City Thunder": ["Thunder", "OKC"],
  "New York Knicks": ["Knicks"],
};

function historyQuestion(category, prompt, groups, team = false) {
  const tiers = ["dunk", "jumpshot", "three", "half"];
  const aliases = team ? TEAM_ALIASES : NAME_ALIASES;
  return {
    category,
    prompt,
    team,
    hint: team ? "The team name or nickname counts." : "Think of any winner in the years shown.",
    answers: groups.flatMap((names, index) => names.map((name) => [name, tiers[index], aliases[name]])),
  };
}

const EXTRA_HISTORY_QUESTIONS = [
  historyQuestion("finals-mvp", "Name an NBA Finals MVP from 1970 through 1979.", [
    ["Kareem Abdul-Jabbar", "Wilt Chamberlain"], ["Bill Walton", "Willis Reed"],
    ["Rick Barry", "John Havlicek"], ["Wes Unseld", "Jo Jo White", "Dennis Johnson"],
  ]),
  historyQuestion("finals-mvp", "Name an NBA Finals MVP from 1980 through 1989.", [
    ["Magic Johnson", "Larry Bird"], ["Kareem Abdul-Jabbar", "Moses Malone"],
    ["Joe Dumars", "James Worthy"], ["Cedric Maxwell"],
  ]),
  historyQuestion("finals-mvp", "Name an NBA Finals MVP from 2000 through 2009.", [
    ["Shaquille O'Neal", "Kobe Bryant", "Tim Duncan"], ["Dwyane Wade"],
    ["Paul Pierce", "Tony Parker"], ["Chauncey Billups"],
  ]),
  historyQuestion("finals-mvp", "Name an NBA Finals MVP from 2010 through 2019.", [
    ["Kobe Bryant", "LeBron James"], ["Kevin Durant", "Dirk Nowitzki"], ["Kawhi Leonard"], ["Andre Iguodala"],
  ]),
  historyQuestion("finals-mvp", "Name an NBA Finals MVP from 2020 through 2025.", [
    ["LeBron James", "Stephen Curry"], ["Giannis Antetokounmpo", "Nikola Jokic"], ["Shai Gilgeous-Alexander"], ["Jaylen Brown"],
  ]),
  historyQuestion("rookie", "Name an NBA Rookie of the Year from 1990 through 1999.", [
    ["Shaquille O'Neal", "Tim Duncan", "Allen Iverson"], ["David Robinson", "Vince Carter", "Jason Kidd"],
    ["Grant Hill", "Chris Webber", "Larry Johnson"], ["Derrick Coleman", "Damon Stoudamire"],
  ]),
  historyQuestion("rookie", "Name an NBA Rookie of the Year from 2000 through 2009.", [
    ["LeBron James", "Kevin Durant", "Derrick Rose"], ["Chris Paul", "Pau Gasol", "Amar'e Stoudemire"],
    ["Brandon Roy", "Elton Brand", "Steve Francis"], ["Mike Miller", "Emeka Okafor"],
  ]),
  historyQuestion("rookie", "Name an NBA Rookie of the Year from 2010 through 2019.", [
    ["Luka Doncic", "Kyrie Irving", "Damian Lillard"], ["Blake Griffin", "Karl-Anthony Towns", "Ben Simmons"],
    ["Andrew Wiggins", "Malcolm Brogdon"], ["Tyreke Evans", "Michael Carter-Williams"],
  ]),
  historyQuestion("sixth-man", "Name an NBA Sixth Man of the Year from 2000 through 2009.", [
    ["Manu Ginobili"], ["Jason Terry", "Leandro Barbosa", "Ben Gordon"],
    ["Mike Miller", "Antawn Jamison", "Bobby Jackson"], ["Rodney Rogers", "Aaron McKie", "Corliss Williamson"],
  ]),
  historyQuestion("sixth-man", "Name an NBA Sixth Man of the Year from 2010 through 2019.", [
    ["James Harden", "Jamal Crawford", "Lou Williams"], ["Lamar Odom", "J.R. Smith"], ["Eric Gordon"], [],
  ]),
  historyQuestion("improved", "Name an NBA Most Improved Player from 2010 through 2019.", [
    ["Giannis Antetokounmpo", "Jimmy Butler", "Paul George"], ["Pascal Siakam", "Kevin Love", "C.J. McCollum"],
    ["Victor Oladipo", "Goran Dragic"], ["Ryan Anderson", "Aaron Brooks"],
  ]),
  historyQuestion("improved", "Name an NBA Most Improved Player from 2020 through 2026.", [
    ["Ja Morant", "Tyrese Maxey"], ["Julius Randle", "Lauri Markkanen"], ["Brandon Ingram", "Dyson Daniels"], ["Nickeil Alexander-Walker"],
  ]),
  historyQuestion("dunk-contest", "Name an NBA Slam Dunk Contest winner from 1990 through 1999.", [
    ["Kobe Bryant", "Dominique Wilkins"], ["Dee Brown", "Isaiah Rider"], ["Brent Barry", "Cedric Ceballos"], ["Harold Miner"],
  ]),
  historyQuestion("dunk-contest", "Name an NBA Slam Dunk Contest winner from 2000 through 2009.", [
    ["Vince Carter", "Dwight Howard", "Nate Robinson"], ["Jason Richardson", "Josh Smith"],
    ["Gerald Green"], ["Fred Jones", "Desmond Mason"],
  ]),
  historyQuestion("dunk-contest", "Name an NBA Slam Dunk Contest winner from 2010 through 2019.", [
    ["Blake Griffin", "Zach LaVine", "Donovan Mitchell"], ["John Wall", "Nate Robinson"],
    ["Terrence Ross", "Glenn Robinson III"], ["Jeremy Evans", "Hamidou Diallo"],
  ]),
  historyQuestion("shootout", "Name an NBA Three-Point Contest winner from 1990 through 1999.", [
    ["Steve Kerr"], ["Glen Rice", "Mark Price"], ["Jeff Hornacek"], ["Tim Legler", "Craig Hodges"],
  ]),
  historyQuestion("shootout", "Name an NBA Three-Point Contest winner from 2000 through 2009.", [
    ["Ray Allen", "Dirk Nowitzki"], ["Peja Stojakovic", "Jeff Hornacek"],
    ["Jason Kapono", "Quentin Richardson"], ["Voshon Lenard", "Daequan Cook"],
  ]),
  historyQuestion("shootout", "Name an NBA Three-Point Contest winner from 2010 through 2019.", [
    ["Stephen Curry", "Klay Thompson", "Devin Booker"], ["Kyrie Irving", "Paul Pierce", "Kevin Love"],
    ["Eric Gordon", "Joe Harris"], ["Marco Belinelli", "James Jones"],
  ]),
  historyQuestion("champions", "Name an NBA team that won a championship from 1980 through 1989.", [
    ["Los Angeles Lakers", "Boston Celtics"], ["Detroit Pistons"], ["Philadelphia 76ers"], [],
  ], true),
  historyQuestion("champions", "Name an NBA team that won a championship from 1990 through 1999.", [
    ["Chicago Bulls"], ["Houston Rockets"], ["San Antonio Spurs"], ["Detroit Pistons"],
  ], true),
  historyQuestion("champions", "Name an NBA team that won a championship from 2000 through 2009.", [
    ["Los Angeles Lakers", "San Antonio Spurs"], ["Boston Celtics", "Miami Heat"], ["Detroit Pistons"], [],
  ], true),
  historyQuestion("champions", "Name an NBA team that won a championship from 2010 through 2019.", [
    ["Golden State Warriors", "Miami Heat"], ["Los Angeles Lakers", "Cleveland Cavaliers"],
    ["San Antonio Spurs", "Toronto Raptors"], ["Dallas Mavericks"],
  ], true),
  historyQuestion("champions", "Name an NBA team that won a championship from 2020 through 2026.", [
    ["Los Angeles Lakers", "Golden State Warriors", "Boston Celtics"], ["Denver Nuggets", "Milwaukee Bucks"],
    ["New York Knicks", "Oklahoma City Thunder"], [],
  ], true),
];
