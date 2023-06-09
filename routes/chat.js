const express = require('express');
const {
  findAllMessagesByRoom,
  allRooms,
  findRoomIDByUser,
  findAgents,
  updateAgentInChatRoom,
  isLastMessage,
  seeLastMessage,
  last2DayRooms,
  last24hoursChat,
  unseenmessagescount,
} = require('../controllers/chat.controller');
const AdminModel = require('../models/Admin.model');

const router = express.Router();

router.get('/rooms/:roomID', async (req, res) => {
  const roomID = req.params.roomID;
  try {
    const result = await findAllMessagesByRoom(roomID);
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.get('/lastmessage/:roomID', async (req, res) => {
  const roomID = req.params.roomID;
  try {
    const result = await isLastMessage(roomID);
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post('/lastmessage/:roomID', async (req, res) => {
  const roomID = req.params.roomID;
  try {
    const result = await seeLastMessage(roomID);

    console.log(true);

    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.get('/rooms', async (req, res) => {
  try {
    const result = await allRooms();
    const userIds = result.map((el) => el.userID);

    let userNames = await AdminModel.find({
      userId: { $in: userIds },
    })
      .select('username userId -_id')
      .lean();

    const finalData = result.map((el) => {
      const user = userNames.find((username) => username.userId === el.userID);
      if (user) {
        return {
          ...el._doc,
          username: user.username,
        };
      }
      return {
        ...el._doc,
        username: el.userID.split('@')[0],
      };
    });

    return res.send(finalData);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.get('/last2drooms', async (req, res) => {
  try {
    const result = await last2DayRooms();
    const userIds = result.map((el) => el.userID);

    let userNames = await AdminModel.find({
      userId: { $in: userIds },
    })
      .select('username userId -_id')
      .lean();

    const finalData = result.map((el) => {
      const user = userNames.find((username) => username.userId === el.userID);
      if (user) {
        return {
          ...el._doc,
          username: user.username,
        };
      }
      return {
        ...el._doc,
        username: el.userID.split('@')[0],
      };
    });

    return res.send(finalData);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});
router.get('/last24chats', async (req, res) => {
  try {
    const hourCount = await last24hoursChat();
    const unseenCount = await unseenmessagescount();

    return res.send({ hourCount, unseenCount });
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});
router.get('/user/:userID', async (req, res) => {
  const user = req.params.userID;
  try {
    const result = await findRoomIDByUser(user);
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.get('/agents', async (req, res) => {
  try {
    const result = await findAgents();
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});
router.post('/agents', async (req, res) => {
  console.log(req.body);
  const { roomID, agentID } = req.body;
  try {
    if (roomID && agentID) {
      const result = await updateAgentInChatRoom(roomID, agentID);
      res.send(result.userID);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

module.exports = router;
