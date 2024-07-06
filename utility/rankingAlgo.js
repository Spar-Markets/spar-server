// TODO: make sure it works
// TODO: timeframe is being passed in MILLISECONDS but i think bro quaratiello expected hours so make it handle millis
// TODO: handle ties (both will be passed in as 1's)
// TODO: implement non linear K multiplier. aka, winning 5 oneday matches should give you more than winning 1 fiveday match. K value
function rankingAlgo(oldEloA, oldEloB, resultA, resultB, timeframe) {
  // convert timeframe to hours
  timeframe = timeframe / (1000 * 60 * 60);

  if (timeframe <= 0.25) {
    K = 20;
  } else if (timeframe <= 24) {
    K = 40;
  } else if (timeframe == 168) {
    K = 120;
  }
  //oldEloA = 3000 * (oldSkillRatingA / 100);
  //oldEloA = 3000 * (oldSkillRatingB / 100);

  // calculate expected score (probability of winning)
  const expectedA = 1 / (1 + 10 ** ((oldEloB - oldEloA) / 400));
  const expectedB = 1 / (1 + 10 ** ((oldEloA - oldEloB) / 400));

  // calculate new skill ratings based on 1. expected score and 2. outcome of game
  const newEloA = parseFloat((oldEloA + K * (resultA - expectedA)).toFixed(2));
  const newEloB = parseFloat((oldEloB + K * (resultB - expectedB)).toFixed(2));

  return {
    oldEloA,
    newEloA,
    oldEloB,
    newEloB,
    timeframe,
  };
}

const eloA = 412;
const eloB = 200;

const resultA = 0; //win
const resultB = 1; //loss

const newElos = rankingAlgo(eloA, eloB, resultA, resultB, 86400000);

console.log("------------------------------------------------------------");
console.log("Elo Algorithm Test");
console.log(newElos);
console.log("------------------------------------------------------------");

module.exports = rankingAlgo;
