// TODO: make sure it works
// TODO: timeframe is being passed in MILLISECONDS but i think bro quaratiello expected hours so make it handle millis
// TODO: handle ties (both will be passed in as 1's)
// TODO: implement non linear K multiplier. aka, winning 5 oneday matches should give you more than winning 1 fiveday match. K value
function rankingAlgo(
  oldSkillRatingA,
  oldSkillRatingB,
  resultA,
  resultB,
  timeframe
) {
  if (timeframe == 24) {
    K = 24;
  } else if (timeframe == 72) {
    K = 72;
  } else if (timeframe == 168) {
    K = 168;
  }
  oldEloA = 3000 * (oldSkillRatingA / 100);
  oldEloB = 3000 * (oldSkillRatingB / 100);
  const expectedA = 1 / (1 + 10 ** ((oldEloB - oldEloA) / 400));
  const expectedB = 1 / (1 + 10 ** ((oldEloA - oldEloB) / 400));

  const newSkillRatingA = parseFloat(
    ((oldEloA + K * (resultA - expectedA)) / 30).toFixed(2)
  );
  const newSkillRatingB = parseFloat(
    ((oldEloB + K * (resultB - expectedB)) / 30).toFixed(2)
  );

  return {
    oldSkillRatingA,
    newSkillRatingA,
    oldSkillRatingB,
    newSkillRatingB,
    timeframe,
  };
}

// const skillRatingA = 67.76;
// const skillRatingB = 67.53;

// const resultA = 1; //win
// const resultB = 0; //loss

// const newElos24 = rankingAlgo(skillRatingA, skillRatingB, resultA, resultB, 24);
// const newElos72 = rankingAlgo(skillRatingA, skillRatingB, resultA, resultB, 72);
// const newElos168 = rankingAlgo(
//   skillRatingA,
//   skillRatingB,
//   resultA,
//   resultB,
//   168
// );

// console.log("------------------------------------------------------------");
// console.log("Elo Algorithm Test");
// console.log(newElos24);
// console.log(newElos72);
// console.log(newElos168);
// console.log("------------------------------------------------------------");

module.exports = rankingAlgo;
