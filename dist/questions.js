const letterKey = (value) => value.normalize("NFD").toLowerCase().replace(/[^a-z]/g, "");

const NAME_ALIASES = {
  "Stephen Curry": ["Steph Curry", "Steph", "Curry"],
  "Klay Thompson": ["Klay"],
  "Ray Allen": ["Ray"],
  "Reggie Miller": ["Reggie"],
  "J.J. Redick": ["JJ Redick", "JJ"],
  "Chauncey Billups": ["Chauncey"],
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
  "Tiny Archibald": ["Nate Archibald", "Nathaniel Archibald"],
  "Johnny Kerr": ["Red Kerr"],
  "Lafayette Lever": ["Fat Lever"],
  "Micheal Ray Richardson": ["Michael Ray Richardson"],
  "Thomas Sanders": ["Tom Sanders", "Satch Sanders"],
  "Dan Schayes": ["Danny Schayes"],
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

const THREE_POINT_TIERS = new Map([
  ["Damian Lillard", "jumpshot"], ["Ray Allen", "dunk"], ["Klay Thompson", "dunk"],
  ["Reggie Miller", "jumpshot"], ["Kyle Korver", "jumpshot"], ["J.J. Redick", "jumpshot"],
  ["Steve Nash", "three"], ["Dell Curry", "three"], ["Dana Barros", "three"], ["Chauncey Billups", "three"],
  ["Jason Kapono", "half"], ["Tim Legler", "half"], ["Voshon Lenard", "half"], ["Wesley Person", "half"],
].map(([name, tier]) => [letterKey(name), tier]));

const THREE_POINT_ANSWERS = CAREER_THREES.map(([name, made]) => {
  const key = letterKey(name);
  const curated = THREE_POINT_TIERS.get(key);
  if (curated) return [name, curated];
  if (HEADLINERS.has(key)) return [name, "dunk"];
  if (FAMILIAR_NAMES.has(key) || made >= 1000) return [name, "jumpshot"];
  return [name, made >= 300 ? "three" : "half"];
});

const aliasesByPlayer = new Map(Object.entries(NAME_ALIASES).flatMap(([name, aliases]) => {
  const variants = [name, ...aliases];
  return variants.filter((variant) => variant.includes(" "))
    .map((variant) => [letterKey(variant), variants.filter((alias) => alias !== variant)]);
}));
const nbaNames = NBA_PLAYER_DIRECTORY.map(([first, last, active, display]) => {
  const name = display ?? `${first} ${last}`.trim();
  const full = letterKey(name);
  const tier = HEADLINERS.has(full) ? "dunk" : FAMILIAR_NAMES.has(full) ? "jumpshot" : active ? "three" : "half";
  const surname = last.replace(/\s+(?:Jr\.?|Sr\.?|II|III|IV|V)$/i, "");
  return { first: letterKey(first), last: letterKey(last), surname: letterKey(surname), full, answer: [name, tier] };
});
const LAST_NAME_KEYS = new Map(nbaNames.map(({ full, last }) => [full, last]));

function nameQuestion(prompt, qualifies) {
  return {
    prompt,
    hint: "Current and former NBA players count. A unique last name works too.",
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
  "Philadelphia 76ers": ["76ers", "Sixers", "Philadelphia Seventy Sixers", "Seventy Sixers"],
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
  "Atlanta Hawks": ["Hawks"],
  "Brooklyn Nets": ["Nets"],
  "Charlotte Hornets": ["Hornets"],
  "Indiana Pacers": ["Pacers"],
  "Los Angeles Clippers": ["Clippers", "LA Clippers"],
  "Memphis Grizzlies": ["Grizzlies", "Grizz"],
  "Minnesota Timberwolves": ["Timberwolves", "Wolves"],
  "New Orleans Pelicans": ["Pelicans", "Pels"],
  "Orlando Magic": ["Magic"],
  "Phoenix Suns": ["Suns"],
  "Portland Trail Blazers": ["Trail Blazers", "Blazers"],
  "Sacramento Kings": ["Kings"],
  "Utah Jazz": ["Jazz"],
  "Washington Wizards": ["Wizards"],
  "Baltimore Bullets": ["Bullets"],
  "Minneapolis Lakers": ["Lakers"],
  "Philadelphia Warriors": ["Warriors"],
  "Rochester Royals": ["Royals"],
  "San Francisco Warriors": ["Warriors"],
  "Seattle SuperSonics": ["SuperSonics", "Sonics"],
  "St. Louis Hawks": ["Hawks"],
  "Syracuse Nationals": ["Nationals"],
  "Washington Bullets": ["Bullets"],
};

const TIERS_BY_INDEX = ["dunk", "jumpshot", "three", "half"];

function historyQuestion(category, prompt, groups, team = false, hint) {
  return {
    category,
    prompt,
    team,
    hint: hint ?? (team ? "The team name or nickname counts." : "Think of any winner in the years shown."),
    answers: groups.flatMap((names, index) => names.map((name) => [name, TIERS_BY_INDEX[index], team ? TEAM_ALIASES[name] : undefined])),
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

const MORE_NAME_QUESTIONS = [
  ...[..."IURSTLCBMDNH"].map((letter) => nameQuestion(
    `Name an NBA player with the letter ${letter} in their name.`,
    ({ full }) => full.includes(letter.toLowerCase()),
  )),
  ...[..."ACKLRSTW"].map((letter) => nameQuestion(
    `Name an NBA player whose first name starts with ${letter}.`,
    ({ first }) => first.startsWith(letter.toLowerCase()),
  )),
  ...[..."ACGHJMSW"].map((letter) => nameQuestion(
    `Name an NBA player whose last name starts with ${letter}.`,
    ({ last }) => last.startsWith(letter.toLowerCase()),
  )),
  nameQuestion("Name an NBA player whose first name ends in N.", ({ first }) => first.endsWith("n")),
  nameQuestion("Name an NBA player whose last name ends in Y.", ({ last }) => last.endsWith("y")),
  nameQuestion("Name an NBA player with a three-letter first name.", ({ first }) => first.length === 3),
  nameQuestion("Name an NBA player with the same first and last initials.", ({ first, last }) => first[0] === last[0]),
];

const NEW_NAME_QUESTIONS = [
  ...["F", "G", "P"].map((letter) => nameQuestion(
    `Name an NBA player with the letter ${letter} in their name.`,
    ({ full }) => full.includes(letter.toLowerCase()),
  )),
  nameQuestion("Name an NBA player whose first name ends in A.", ({ first }) => first.endsWith("a")),
  ...["D", "R"].map((letter) => nameQuestion(
    `Name an NBA player whose last name starts with ${letter}.`,
    ({ surname }) => surname.startsWith(letter.toLowerCase()),
  )),
  ...[[4, "four"], [5, "five"], [6, "six"]].map(([length, label]) => nameQuestion(
    `Name an NBA player with a ${label}-letter first name.`,
    ({ first }) => first.length === length,
  )),
  nameQuestion("Name an NBA player whose last name ends in S.", ({ surname }) => surname.endsWith("s")),
  nameQuestion("Name an NBA player whose last name ends in SON.", ({ surname }) => surname.endsWith("son")),
  ...[[4, "four"], [7, "seven"]].map(([length, label]) => nameQuestion(
    `Name an NBA player with a ${label}-letter last name.`,
    ({ surname }) => surname.length === length,
  )),
  nameQuestion("Name an NBA player whose last name starts and ends with the same letter.",
    ({ surname }) => surname.length > 1 && surname[0] === surname.at(-1)),
];

const NBA_DIVISIONS = {
  Atlantic: [["Boston Celtics", "New York Knicks"], ["Philadelphia 76ers", "Toronto Raptors"], ["Brooklyn Nets"]],
  Central: [["Chicago Bulls", "Milwaukee Bucks"], ["Cleveland Cavaliers", "Detroit Pistons"], ["Indiana Pacers"]],
  Southeast: [["Miami Heat"], ["Orlando Magic", "Atlanta Hawks"], ["Charlotte Hornets"], ["Washington Wizards"]],
  Northwest: [["Denver Nuggets", "Oklahoma City Thunder"], ["Minnesota Timberwolves"], ["Portland Trail Blazers"], ["Utah Jazz"]],
  Pacific: [["Los Angeles Lakers", "Golden State Warriors"], ["Phoenix Suns", "Los Angeles Clippers"], ["Sacramento Kings"]],
  Southwest: [["San Antonio Spurs", "Dallas Mavericks"], ["Houston Rockets"], ["Memphis Grizzlies"], ["New Orleans Pelicans"]],
};

const teamQuestion = (prompt, groups) => historyQuestion("team-alignment", prompt, groups, true);
const conference = (...divisions) => TIERS_BY_INDEX.map((_, index) =>
  divisions.flatMap((division) => NBA_DIVISIONS[division][index] ?? []),
);

const MORE_HISTORY_QUESTIONS = [
  ...Object.entries(NBA_DIVISIONS).map(([division, groups]) =>
    teamQuestion(`Name an NBA team in the ${division} Division as of 2026–27.`, groups)),
  teamQuestion("Name an NBA team in the Eastern Conference as of 2026–27.", conference("Atlantic", "Central", "Southeast")),
  teamQuestion("Name an NBA team in the Western Conference as of 2026–27.", conference("Northwest", "Pacific", "Southwest")),
  teamQuestion("Name an NBA team based in California as of 2026–27.", [
    ["Los Angeles Lakers", "Golden State Warriors"], ["Los Angeles Clippers"], ["Sacramento Kings"],
  ]),
  teamQuestion("Name an NBA team based in Texas as of 2026–27.", [
    ["San Antonio Spurs", "Dallas Mavericks"], ["Houston Rockets"],
  ]),
  ...["A", "O"].map((letter) => {
    const groups = conference(...Object.keys(NBA_DIVISIONS)).map((names) =>
      names.filter((name) => TEAM_ALIASES[name][0].toUpperCase().includes(letter)));
    return teamQuestion(`Name a 2026–27 NBA team with the letter ${letter} in its nickname.`, groups);
  }),

  ...[
    [1970, 1979, [["Magic Johnson", "Bill Walton"], ["Bob Lanier", "David Thompson"], ["Doug Collins", "Mychal Thompson"], ["Austin Carr", "Kent Benson", "John Lucas", "LaRue Martin"]]],
    [1980, 1989, [["Hakeem Olajuwon", "David Robinson"], ["Patrick Ewing", "James Worthy"], ["Ralph Sampson", "Danny Manning", "Mark Aguirre"], ["Brad Daugherty", "Joe Barry Carroll", "Pervis Ellison"]]],
    [1990, 1999, [["Shaquille O'Neal", "Allen Iverson", "Tim Duncan"], ["Chris Webber", "Larry Johnson"], ["Glenn Robinson", "Elton Brand"], ["Derrick Coleman", "Joe Smith", "Michael Olowokandi"]]],
    [2000, 2009, [["LeBron James", "Derrick Rose", "Dwight Howard"], ["Yao Ming", "Blake Griffin"], ["Andrew Bogut", "Greg Oden"], ["Andrea Bargnani", "Kwame Brown", "Kenyon Martin"]]],
    [2010, 2019, [["Anthony Davis", "Kyrie Irving", "Zion Williamson"], ["John Wall", "Karl-Anthony Towns", "Ben Simmons"], ["Andrew Wiggins", "Deandre Ayton"], ["Markelle Fultz", "Anthony Bennett"]]],
    [2020, 2026, [["Victor Wembanyama", "Anthony Edwards"], ["Cooper Flagg", "Cade Cunningham", "Paolo Banchero"], ["AJ Dybantsa"], ["Zaccharie Risacher"]]],
  ].map(([start, end, groups]) => historyQuestion("draft", `Name a No. 1 NBA draft pick from ${start} through ${end}.`, groups,
    false, "Think of the first player selected in any year shown.")),

  ...[
    [1951, 1959, [["George Mikan"], ["Bob Cousy", "Bob Pettit"], ["Bill Sharman", "Paul Arizin"], ["Ed Macauley"]]],
    [1960, 1969, [["Wilt Chamberlain", "Bill Russell"], ["Oscar Robertson", "Rick Barry"], ["Jerry Lucas", "Bob Pettit"], ["Hal Greer", "Adrian Smith"]]],
    [1970, 1979, [["Julius Erving", "Jerry West"], ["Walt Frazier", "Willis Reed", "Dave Cowens"], ["Bob Lanier", "David Thompson"], ["Lenny Wilkens", "Dave Bing", "Randy Smith"]]],
    [1980, 1989, [["Michael Jordan", "Larry Bird"], ["Isiah Thomas", "Julius Erving", "Karl Malone"], ["George Gervin", "Ralph Sampson"], ["Tiny Archibald", "Tom Chambers"]]],
    [1990, 1999, [["Michael Jordan", "Magic Johnson"], ["Charles Barkley", "Scottie Pippen"], ["John Stockton", "Karl Malone"], ["Glen Rice", "Mitch Richmond"]]],
    [2000, 2009, [["Kobe Bryant", "LeBron James", "Shaquille O'Neal"], ["Allen Iverson", "Tim Duncan", "Kevin Garnett"]]],
    [2010, 2019, [["Kobe Bryant", "LeBron James", "Kevin Durant"], ["Russell Westbrook", "Dwyane Wade"], ["Chris Paul", "Kyrie Irving", "Anthony Davis"]]],
    [2020, 2026, [["Stephen Curry", "Giannis Antetokounmpo"], ["Kawhi Leonard", "Damian Lillard"], ["Jayson Tatum", "Anthony Edwards"]]],
  ].map(([start, end, groups]) => historyQuestion("all-star-mvp", `Name an NBA All-Star Game MVP from ${start} through ${end}.`, groups)),

  ...[
    [1956, 1959, [["Bill Russell"], ["Bob Cousy"], ["Bob Pettit"]]],
    [1960, 1969, [["Wilt Chamberlain", "Bill Russell"], ["Oscar Robertson"], ["Wes Unseld"]]],
    [1970, 1979, [["Kareem Abdul-Jabbar"], ["Moses Malone", "Bill Walton"], ["Willis Reed", "Bob McAdoo"], ["Dave Cowens"]]],
    [1980, 1989, [["Michael Jordan", "Magic Johnson", "Larry Bird"], ["Kareem Abdul-Jabbar"], ["Julius Erving"], ["Moses Malone"]]],
    [1990, 1999, [["Michael Jordan", "Magic Johnson"], ["Hakeem Olajuwon", "Charles Barkley"], ["Karl Malone", "David Robinson"]]],
    [2000, 2009, [["Kobe Bryant", "Shaquille O'Neal", "LeBron James"], ["Tim Duncan", "Allen Iverson"], ["Kevin Garnett", "Dirk Nowitzki"], ["Steve Nash"]]],
    [2010, 2019, [["LeBron James", "Stephen Curry", "Kevin Durant"], ["Giannis Antetokounmpo", "Derrick Rose"], ["James Harden", "Russell Westbrook"]]],
    [2020, 2026, [["Nikola Jokic", "Giannis Antetokounmpo"], ["Shai Gilgeous-Alexander", "Joel Embiid"]]],
  ].map(([start, end, groups]) => historyQuestion("season-mvp", `Name an NBA regular-season MVP from ${start} through ${end}.`, groups,
    false, "Use the year the season ended.")),

  ...[
    [1983, 1989, [["Michael Jordan"], ["Mark Eaton", "Michael Cooper"], ["Sidney Moncrief"], ["Alvin Robertson"]]],
    [1990, 1999, [["Dennis Rodman", "Hakeem Olajuwon"], ["David Robinson", "Dikembe Mutombo"], ["Gary Payton"], ["Alonzo Mourning"]]],
    [2000, 2009, [["Ben Wallace", "Dwight Howard"], ["Kevin Garnett", "Dikembe Mutombo"], ["Ron Artest", "Alonzo Mourning"], ["Marcus Camby"]]],
    [2010, 2019, [["Dwight Howard", "Kawhi Leonard"], ["Rudy Gobert", "Draymond Green"], ["Marc Gasol", "Joakim Noah"], ["Tyson Chandler"]]],
    [2020, 2026, [["Victor Wembanyama", "Giannis Antetokounmpo"], ["Rudy Gobert"], ["Evan Mobley", "Jaren Jackson Jr."], ["Marcus Smart"]]],
  ].map(([start, end, groups]) => historyQuestion("defense", `Name an NBA Defensive Player of the Year from ${start} through ${end}.`, groups,
    false, "Use the year the season ended.")),

  ...[
    [1953, 1959, [["Elgin Baylor"], ["Bob Pettit", "Tom Heinsohn"], ["Maurice Stokes"], ["Don Meineke", "Ray Felix", "Wood Sauldsberry"]]],
    [1960, 1969, [["Wilt Chamberlain", "Oscar Robertson"], ["Rick Barry", "Willis Reed", "Wes Unseld"], ["Walt Bellamy", "Jerry Lucas", "Earl Monroe"], ["Dave Bing", "Terry Dischinger"]]],
    [1970, 1979, [["Kareem Abdul-Jabbar"], ["Bob McAdoo", "Dave Cowens"], ["Adrian Dantley", "Jamaal Wilkes", "Walter Davis"], ["Geoff Petrie", "Sidney Wicks", "Ernie DiGregorio", "Alvan Adams", "Phil Ford"]]],
    [1980, 1989, [["Larry Bird", "Michael Jordan"], ["Patrick Ewing", "Ralph Sampson"], ["Mark Jackson", "Mitch Richmond", "Buck Williams"], ["Terry Cummings", "Chuck Person", "Darrell Griffith"]]],
    [2020, 2026, [["Victor Wembanyama", "Cooper Flagg"], ["Ja Morant", "Paolo Banchero", "LaMelo Ball"], ["Scottie Barnes"], ["Stephon Castle"]]],
  ].map(([start, end, groups]) => historyQuestion("rookie", `Name an NBA Rookie of the Year from ${start} through ${end}.`, groups,
    false, "Use the year the season ended.")),

  historyQuestion("finals-mvp", "Name an NBA Finals MVP from 1990 through 1999.", [
    ["Michael Jordan"], ["Tim Duncan", "Hakeem Olajuwon"], ["Isiah Thomas"],
  ]),
  ...[
    [1983, 1989, [["Bill Walton"], ["Kevin McHale"], ["Bobby Jones", "Ricky Pierce"], ["Eddie Johnson", "Roy Tarpley"]]],
    [1990, 1999, [["Toni Kukoc"], ["Dell Curry", "John Starks"], ["Detlef Schrempf", "Danny Manning", "Anthony Mason"], ["Ricky Pierce", "Clifford Robinson", "Darrell Armstrong"]]],
    [2020, 2026, [["Tyler Herro"], ["Naz Reid", "Jordan Clarkson"], ["Payton Pritchard", "Malcolm Brogdon"], ["Montrezl Harrell", "Keldon Johnson"]]],
  ].map(([start, end, groups]) => historyQuestion("sixth-man", `Name an NBA Sixth Man of the Year from ${start} through ${end}.`, groups,
    false, "Use the year the season ended.")),
  ...[
    [1986, 1989, [["Kevin Johnson"], ["Dale Ellis"], ["Alvin Robertson"], ["Kevin Duckworth"]]],
    [1990, 1999, [["Scott Skiles"], ["Mahmoud Abdul-Rauf", "Gheorghe Muresan"], ["Dana Barros", "Darrell Armstrong", "Rony Seikaly"], ["Pervis Ellison", "Don MacLean", "Isaac Austin", "Alan Henderson"]]],
    [2000, 2009, [["Tracy McGrady", "Gilbert Arenas"], ["Zach Randolph", "Jermaine O'Neal", "Jalen Rose"], ["Boris Diaw", "Monta Ellis", "Hedo Turkoglu"], ["Bobby Simmons", "Danny Granger"]]],
  ].map(([start, end, groups]) => historyQuestion("improved", `Name an NBA Most Improved Player from ${start} through ${end}.`, groups,
    false, "Use the year the season ended.")),

  historyQuestion("dunk-contest", "Name an NBA Slam Dunk Contest winner from 1984 through 1989.", [
    ["Michael Jordan", "Dominique Wilkins"], ["Spud Webb"], ["Larry Nance"], ["Kenny Walker"],
  ]),
  historyQuestion("dunk-contest", "Name an NBA Slam Dunk Contest winner from 2020 through 2026.", [
    ["Mac McClung"], ["Obi Toppin", "Anfernee Simons"], ["Derrick Jones Jr."], ["Keshad Johnson"],
  ]),
  historyQuestion("shootout", "Name an NBA Three-Point Contest winner from 1986 through 1989.", [
    ["Larry Bird"], [], [], ["Dale Ellis"],
  ]),
  historyQuestion("shootout", "Name an NBA Three-Point Contest winner from 2020 through 2026.", [
    ["Stephen Curry", "Damian Lillard"], ["Karl-Anthony Towns"], ["Tyler Herro"], ["Buddy Hield"],
  ]),

  historyQuestion("champions", "Name a team that won a BAA championship from 1947 through 1949.", [
    ["Minneapolis Lakers"], ["Philadelphia Warriors"], [], ["Baltimore Bullets"],
  ], true),
  historyQuestion("champions", "Name an NBA team that won a championship from 1950 through 1959.", [
    ["Minneapolis Lakers", "Boston Celtics"], ["Philadelphia Warriors"], ["St. Louis Hawks"], ["Rochester Royals", "Syracuse Nationals"],
  ], true),
  historyQuestion("champions", "Name an NBA team that won a championship from 1960 through 1969.", [
    ["Boston Celtics"], [], ["Philadelphia 76ers"],
  ], true),
  historyQuestion("champions", "Name an NBA team that won a championship from 1970 through 1979.", [
    ["Los Angeles Lakers", "Boston Celtics", "New York Knicks"], ["Golden State Warriors", "Milwaukee Bucks"],
    ["Portland Trail Blazers", "Seattle SuperSonics"], ["Washington Bullets"],
  ], true),

  ...[500, 1000, 1500, 2000].map((minimum) => ({
    category: "shooting-records",
    prompt: `Name an NBA player with at least ${minimum.toLocaleString("en-US")} career three-pointers.`,
    hint: "Regular-season totals through the end of 2025–26.",
    answers: THREE_POINT_ANSWERS.filter((_, index) => CAREER_THREES[index][1] >= minimum),
  })),
  historyQuestion("single-game-scoring", "Name an NBA player who scored 50+ points in a Finals game through 2026.", [
    ["Michael Jordan", "LeBron James"], ["Giannis Antetokounmpo", "Jerry West"],
    ["Elgin Baylor", "Rick Barry"], ["Bob Pettit"],
  ], false, "Any single game in the NBA Finals counts."),
  historyQuestion("single-game-scoring", "Name an NBA player who scored 55+ points in a playoff game through 2026.", [
    ["Michael Jordan", "Wilt Chamberlain"], ["Allen Iverson", "Damian Lillard", "Charles Barkley"],
    ["Donovan Mitchell", "Jimmy Butler"], ["Elgin Baylor", "Rick Barry"],
  ], false, "Any round of the NBA Playoffs counts."),
  historyQuestion("triple-doubles", "Name an NBA player with an officially recorded quadruple-double through 2025–26.", [
    ["Hakeem Olajuwon"], ["David Robinson"], ["Nate Thurmond"], ["Alvin Robertson"],
  ], false, "Four players reached double digits in four statistical categories."),
  historyQuestion("season-mvp", "Name an NBA player with five or more regular-season MVP awards through 2025–26.", [
    ["Michael Jordan"], ["Kareem Abdul-Jabbar"], ["Bill Russell"],
  ], false, "Three players have won at least five."),

  historyQuestion("nba-cup", "Name a team that won the NBA Cup from 2023 through 2025.", [
    ["Los Angeles Lakers"], ["Milwaukee Bucks"], ["New York Knicks"],
  ], true),
  historyQuestion("nba-cup", "Name an NBA Cup MVP from 2023 through 2025.", [
    ["LeBron James"], ["Giannis Antetokounmpo"], ["Jalen Brunson"],
  ]),
  historyQuestion("champions", "Name an NBA team that lost in the Finals from 2010 through 2019.", [
    ["Golden State Warriors", "Cleveland Cavaliers"], ["Boston Celtics", "Miami Heat"],
    ["San Antonio Spurs"], ["Oklahoma City Thunder"],
  ], true),
  historyQuestion("champions", "Name an NBA team that lost in the Finals from 2020 through 2026.", [
    ["Boston Celtics", "Miami Heat"], ["Dallas Mavericks", "San Antonio Spurs"], ["Phoenix Suns"], ["Indiana Pacers"],
  ], true),
  historyQuestion("skills-challenge", "Name an NBA All-Star Skills Challenge winner from 2003 through 2009.", [
    ["Dwyane Wade", "Derrick Rose"], ["Steve Nash", "Jason Kidd"], ["Baron Davis"], ["Deron Williams"],
  ]),
  historyQuestion("skills-challenge", "Name an NBA All-Star Skills Challenge winner from 2010 through 2019.", [
    ["Stephen Curry", "Damian Lillard", "Jayson Tatum"], ["Steve Nash", "Tony Parker", "Karl-Anthony Towns"],
    ["Kristaps Porzingis", "Patrick Beverley"], ["Trey Burke", "Spencer Dinwiddie"],
  ]),
];

const directoryTiers = new Map(nbaNames.map(({ full, answer }) => [full, answer[1]]));
const NEW_HISTORY_QUESTIONS = RECORD_AND_TEAM_PROMPTS.map(([category, prompt, hint, names]) => ({
  category,
  prompt,
  hint,
  answers: names.map((name) => [name, directoryTiers.get(letterKey(name)) ?? "half"]),
}));
