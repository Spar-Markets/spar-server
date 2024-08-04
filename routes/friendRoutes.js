const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Friends = require("../models/Friends");

router.post("/addFriendRequest", async (req, res) => {
  const { userID, requestedUserID } = req.body;

  try {
    // ERROR CHECK 1: check to make sure there is not an existing incoming friend request from the other user
    const requestedUser = await Friends.findOne(
      { userID: userID },
      "incomingFriendRequests -_id"
    );

    const incomingRequestExists =
      requestedUser._doc.incomingFriendRequests.some(
        (friendRequest) => friendRequest.userID == requestedUserID
      );

    if (incomingRequestExists) {
      return res
        .status(409)
        .json({ error: "Incoming friend request already exists" });
    }

    // ERROR CHECK 2: check to make sure there is not an existing outgoing friend request to the other user
    const requestingUser = await Friends.findOne(
      { userID: userID },
      "outgoingFriendRequests -_id"
    );

    const outgoingRequestExists = requestingUser.outgoingFriendRequests.some(
      (request) => request.userID === userID
    );

    if (outgoingRequestExists) {
      return res
        .status(409)
        .json({ error: "Outgoing friend request already exists" });
    }

    // Now we actually add the friend request
    const updatedOutgoingFriendRequest = await Friends.updateOne(
      { userID: userID },
      {
        $push: {
          outgoingFriendRequests: {
            userID: requestedUserID,
            createdAt: Date.now(),
          },
        },
      }
    );

    const updatedIncomingFriendRequest = await Friends.updateOne(
      { userID: requestedUserID },
      {
        $push: {
          incomingFriendRequests: {
            userID: userID,
            createdAt: Date.now(),
          },
        },
      }
    );

    return res.status(200).send("Successfully updated friend request");
  } catch (error) {
    console.error("Error adding follow request:", error);
    return res
      .status(500)
      .send("An error occurred while adding the follow request");
  }
});

router.post("/acceptFriendRequest", async (req, res) => {
  const { acceptedUserID, requesterUserID } = req.body;

  try {
    // STEP 1: check if friend request actualy exists
    const requestingUser = await Friends.findOne(
      { userID: requesterUserID },
      "outgoingFriendRequests -_id"
    );

    if (!requestingUser || !requestingUser.outgoingFriendRequests) {
      return res.status(404).json({ error: "Requesting user not found" });
    }

    // ADD ERROR HANDLING

    // STEP 2: remove from incoming friend requests
    const accepted = await Friends.updateOne(
      { userID: acceptedUserID },
      {
        $pull: {
          incomingFriendRequests: { userID: requesterUserID },
        },
      }
    );

    // STEP 3: remove from outgoing friend requests
    await Friends.updateOne(
      { userID: requesterUserID },
      {
        $pull: {
          outgoingFriendRequests: { userID: acceptedUserID },
        },
      }
    );

    // STEP 4: add friend to each user's friends
    await Friends.updateOne(
      { userID: requesterUserID },
      {
        $push: {
          friends: acceptedUserID,
        },
      }
    );

    await Friends.updateOne(
      { userID: acceptedUserID },
      {
        $push: {
          friends: requesterUserID,
        },
      }
    );

    // STEP 5: increment each user's friend count
    await User.updateOne(
      { userID: requesterUserID },
      {
        $inc: {
          friendCount: 1,
        },
      }
    );

    await User.updateOne(
      { userID: acceptedUserID },
      {
        $inc: {
          friendCount: 1,
        },
      }
    );

    return res.status(200).send("Friend request succesfully accepted");
  } catch (error) {
    console.error("error in /acceptFriendRequest:", error);
  }
});

router.post("/checkIncomingFriendRequests", async (req, res) => {
  const { userID } = req.body;

  try {
    // Find the user by userID
    const incomingFriendRequestsDoc = await Friends.findOne(
      { userID },
      "incomingFriendRequests -_id"
    );

    if (!incomingFriendRequestsDoc) {
      return res.status(404).send("User not found");
    }

    res.status(200).send(incomingFriendRequestsDoc._doc.incomingFriendRequests);
  } catch (error) {
    console.error("Error checking incoming friend requests:", error);
    res
      .status(500)
      .send("An error occurred while checking incoming friend requests");
  }
});

router.post("/checkRequestedStatus", async (req, res) => {
  const { yourUserID, checkUserID } = req.body;
  try {
    const outgoingFriendRequests = await Friends.findOne(
      { userID: yourUserID },
      "outgoingFriendRequests -_id"
    );
    const requestedStatus =
      outgoingFriendRequests._doc.outgoingFriendRequests.some(
        (obj) => obj.userID == checkUserID
      );
    return res.status(200).send(requestedStatus);
  } catch (error) {
    console.error("Error on /checkRequestedStatus:", error);
    return res.status(200).json({ error: error });
  }
});

router.post("/getFriends", async (req, res) => {
  const { userID } = req.body;

  try {
    // Find the document in the Friends collection by userID
    const userFriends = await Friends.findOne(
      { userID: userID },
      "friends -_id"
    );

    if (!userFriends) {
      return res.status(404).send("No friends found for this user");
    }

    // Return the friends array
    res.status(200).send(userFriends.friends);
  } catch (error) {
    console.error("Error retrieving friends:", error);
    res.status(500).send("Server error when trying to get friends");
  }
});

router.post("/friendshipCheck", async (req, res) => {
  const { user1ID, user2ID } = req.body;

  try {
    const user1FriendsDoc = await Friends.findOne({ userID: user1ID }, 'friends -_id');
    console.log("user1FriendsDoc", user1FriendsDoc);
    const isFriends = user1FriendsDoc._doc.friends.some(id => id == user2ID);
    return res.status(200).send(isFriends);
  } catch (error) {
    console.error("error in /friendshipCheck");
    return res.status(500).json({ error: error });
  }

})

router.post("/deleteFriendRequest", async (req, res) => {
  const { targetUserID, requesterUserID } = req.body;

  try {
    // decline it
    await Friends.updateOne(
      { userID: targetUserID },
      {
        $pull: {
          incomingFriendRequests: { userID: requesterUserID },
        },
      }
    );

    await Friends.updateOne(
      { userID: requesterUserID },
      {
        $pull: {
          outgoingFriendRequests: { userID: targetUserID },
        },
      }
    );

    return res.status(200).send("Successfully declined friend request");
  } catch (error) {
    console.error("error in /declineFriendRequest endpoint:", error);
    return res.status(500).json({ error: error })
  }
})

module.exports = router;