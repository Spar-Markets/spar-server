const User = require("../models/User");
const Match = require("../models/Match");
const MatchHistory = require("../models/MatchHistory");
const axios = require("axios");
const rankingAlgo = require("../utility/rankingAlgo");

/**
 * Logic to finish match
 * 1. grab match from matchID
 * 2. determine winner
 * 3. update rank
 * 4. distribute winnings
 * 5. delete match from both user's active matches (WE NEED TO DO THIS)
 * 6. put in each user's match history
 * 7. delete match from 'matches' collection
 */
const finishMatch = async (matchToFinish) => {
  // 1. Get the matchID. We already gyatt matchToFinish
  const matchID = matchToFinish.matchID;
  console.log("finishing match", matchToFinish);

  // 2. determine winner
  // calculate portfolio value of each user
  async function calculatePortfolioValue(user) {
    let portfolioValue = matchToFinish[user].buyingPower;

    const assets = matchToFinish[user].assets;

    // get current price for each ticker
    for (tickerObject in assets) {
      const response = await axios.get(
        `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${tickerObject.ticker}?apiKey=${polygonKey}`
      );
      const currentPrice = reponse.data.ticker.min.c;

      // add value of shares to portfolioValue
      portfolioValue += currentPrice * tickerObject.totalShares;
    }

    // return portfolio value
    return portfolioValue;
  }

  // get userID of winner and loser
  let winner = "";
  let loser = "";
  let draw = 0;
  const user1PortfolioValue = await calculatePortfolioValue("user1");
  const user2PortfolioValue = await calculatePortfolioValue("user2");
  if (user1PortfolioValue > user2PortfolioValue) {
    winner = "user1";
    loser = "user2";
  } else if (user2PortfolioValue > user1PortfolioValue) {
    winner = "user2";
    loser = "user1";
  } else {
    draw = 1;
    // this winner and loser are arbitrary. don't worry, our logic will recognize it's a draw
    winner = "user1";
    loser = "user2";
  }

  // get user IDs for winner and loser
  const winnerUserID = matchToFinish[winner].userID;
  const loserUserID = matchToFinish[loser].userID;

  // get actual user in DB for winner and loser
  let winnerUser;
  let loserUser;
  try {
    winnerUser = await User.findOne({ userID: winnerUserID });
    loserUser = await User.findOne({ userID: loserUserID });
  } catch (error) {
    console.error(
      "got a loan from the white house boom: Error finding the winner or the loser inside the database by ID in finishMatch logic.",
      error
    );

    return;
  }

  // winner is now determined

  // 3. update rank

  // get old skill rating of each user
  const oldSkillRatingWinner = winnerUser.skillRating;
  const oldSkillRatingLoser = loserUser.skillRating;

  // run function to get updated rank values for each user
  const rankingAlgoResults = rankingAlgo(
    oldSkillRatingWinner,
    oldSkillRatingLoser,
    1,
    draw,
    matchToFinish.timeframe
  );

  // get new rank from rankingAlgo
  const newSkillRatingWinner = rankingAlgoResults.newEloA;
  const newSkillRatingLoser = rankingAlgoResults.newEloB;

  console.log("STEP 3: newSkillRatingWinner", newSkillRatingWinner);
  console.log("STEP 3: newSkillRatingLoser", newSkillRatingLoser);

  // update rank for each player
  winnerUser.skillRating = newSkillRatingWinner;
  loserUser.skillRating = newSkillRatingLoser;

  // save updated rank to database
  try {
    const updatedWinnerUser = await winnerUser.save();
    const updatedLoserUser = await loserUser.save();
  } catch (error) {
    console.error(
      "sent that shit straight to the moon: error in finishMatch logic in saving winner and loser users to database",
      error
    );
  }

  // 4. distribute winnings
  try {
    if (draw == 0) {
      // if not a draw, award winnings to winner
      const winnings = matchToFinish.wagerAmt * 2 * 0.9;
      winnerUser.balance = winnerUser.balance + winnings;
      const updatedWinnerUser = await winnerUser.save();
    } else if (draw == 1) {
      // if draw, return wager to each user
      const initialWager = matchToFinish.wagerAmt;
      winnerUser.balance = winnerUser.balance + initialWager;
      loserUser.balance = loserUser.balance + initialWager;
      const updatedWinnerUser = await winnerUser.save();
      const updatedLoserUser = await loserUser.save();
      console.log("updatedWinnerUser", updatedWinnerUser);
      console.log("updatedLoserUser", updatedLoserUser);
    }
  } catch (error) {
    console.error(
      "now i'm taking mankind to mars, but for your kind man, I ain't got room: error in finishMatch logic in distributing winnings to winer/loser",
      error
    );
  }

  // 5. delete match from both user's active matches

  // grab both user documents from db

  // iterate over activematches field for each user until you find the match in question
  // delete that match

  console.log("STEP 5: DELETE MATCH FROM ACTIVE MATCHES. STARTING NOW.");
  console.log("We boutta delete matchID from user active matches:", matchID);
  console.log("We boutta delete it from this user:", winnerUserID);
  const winnerWithRemovedMatchID = await User.updateOne(
    { userID: winnerUserID },
    { $pull: { activeMatches: matchID } }
  );
  const loserWithRemovedMatchID = await User.updateOne(
    { userID: loserUserID },
    { $pull: { activematches: matchID } }
  );
  console.log(
    "winnerWithRemovedMatchID",
    winnerWithRemovedMatchID.activeMatches
  );
  console.log("loserWithRemovedMatchID", loserWithRemovedMatchID.activeMatches);

  // 6. put match in each users match history
  // TODO: make custom match object to store in history.
  //       since each object is pegged to each user, we can clarify which is "you" and which is "opponent"
  //       we can also have a field for whether they won or lost
  try {
    const resultWinner = await MatchHistory.updateOne(
      { userID: winnerUserID },
      { $push: { pastMatches: matchToFinish } },
      { upsert: true }
    );
    const resultLoser = await MatchHistory.updateOne(
      { userID: loserUserID },
      { $push: { pastMatches: matchToFinish } },
      { upsert: true }
    );
  } catch (error) {
    console.error(
      "your platform only launches depression: error in finishMatch logic in putting match in matchhistory for each user",
      error
    );
  }
};

module.exports = finishMatch;
