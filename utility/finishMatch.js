const User = require("../models/User");
const Match = require("../models/Match");
const MatchHistory = require("../models/MatchHistory");
const MatchSnapshots = require("../models/MatchSnapshots");
const MatchHistorySnapshots = require("../models/MatchHistorySnapshots");
const axios = require("axios");
const rankingAlgo = require("../utility/rankingAlgo");
const { polygonKey } = require("../config/constants");
const getCurrentPrice = require("./getCurrentPrice");

/**
 * Logic to finish match.
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
  console.log("STEP 1: Running finishing match at", Date.now(), matchToFinish);

  // 2. determine winner
  // calculate portfolio value of each user
  async function calculatePortfolioValue(user) {
    let portfolioValue = matchToFinish[user].buyingPower;

    const assets = matchToFinish[user].assets;

    // get current price for each ticker
    for (tickerObject in assets) {
      try {
        const currentPrice = await getCurrentPrice(tickerObject.ticker);
        console.log("MAMA I WANT MILKY!!! Price for", tickerObject.ticker, "is", currentPrice);

        // add value of shares to portfolioValue
        portfolioValue += currentPrice * tickerObject.totalShares;
      } catch (error) {
        console.error("ERROR GETTING DATA FOR TICKER:", tickerObject.ticker);
      }
    }

    console.log("I STILL WANT MILKY!!! portfolio value is:", portfolioValue);

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

  console.log("STEP 2: The winner is", winner);
  console.log("The loser is", loser);

  // get user IDs for winner and loser
  const winnerUserID = matchToFinish[winner].userID;
  const loserUserID = matchToFinish[loser].userID;

  console.log("STEP 3: Winner user ID:", winnerUserID);
  console.log("Loser user ID:", loserUserID);

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

  console.log("STEP 4: New skill rating for winner:", newSkillRatingWinner);
  console.log("New skill rating for loser:", newSkillRatingLoser);

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
      console.log("STEP 5: updatedWinnerUser", updatedWinnerUser);
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

  console.log("ABOUT TO REMOVE MATCH FROM USERIDs:", winnerUserID, loserUserID);

  const winnerWithRemovedMatchID = await User.updateOne(
    { userID: winnerUserID },
    { $pull: { activematches: { matchID: matchID } } }
  );
  const loserWithRemovedMatchID = await User.updateOne(
    { userID: loserUserID },
    { $pull: { activematches: { matchID: matchID } } } //{matchID: endAt, ...},
  );
  // { matchID: date, matchID2: date }
  console.log(
    "STEP 6: AFTER MATCH DELETION, winner user:",
    winnerWithRemovedMatchID
  );
  console.log("AFTER MATCH DELETION, loser user:", loserWithRemovedMatchID);

  // 6. put match in each users match history
  // TODO: make custom match object to store in history.
  //       since each object is pegged to each user, we can clarify which is "you" and which is "opponent"
  //       we can also have a field for whether they won or lost
  const matchHistoryObject = {
    ...matchToFinish,
    user1FinalValue: user1PortfolioValue,
    user2FinalValue: user2PortfolioValue,
  };

  try {
    const resultWinner = await MatchHistory.updateOne(
      { userID: winnerUserID },
      { $push: { pastMatches: matchHistoryObject } },
      { upsert: true }
    );
    const resultLoser = await MatchHistory.updateOne(
      { userID: loserUserID },
      { $push: { pastMatches: matchHistoryObject } },
      { upsert: true }
    );
  } catch (error) {
    console.error(
      "your platform only launches depression: error in finishMatch logic in putting match in matchhistory for each user",
      error
    );
  }

  // 7. transfer match snapshots to matchHistorySnapshots
  try {
    // step 1: get match snapshots
    const matchSnapshots = await MatchSnapshots.findOne({ matchID: matchID });
    if (!matchSnapshots) {
      throw new Error("MATCH SNAPSHOTS NOT FOUND");
    }
    // step 2: put match snapshots in matchhistorysnapshots
    await MatchHistorySnapshots.create(matchSnapshots.toObject());

    // step 3: remove the snapshot from MatchSnapshots
    await MatchSnapshots.deleteOne({ matchID: matchID });
  } catch (error) {
    console.error(
      "FinishMatch: Error transferring match snapshots to matchHistorySnapshots:",
      error
    );
  }

  // return the updated winnings
  if (draw) {
    return {
      [winnerUserID]: matchToFinish.wagerAmt,
      [loserUserID]: matchToFinish,
    };
  } else {
    return {
      [winnerUserID]: matchToFinish.wagerAmt * 2 * 0.9,
    };
  }
};

module.exports = finishMatch;
