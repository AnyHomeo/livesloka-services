const express = require('express');
const {
  addNewMessageToNonRoom,
  createNewNonRoom,
  findAllMessagesByNonRoom,
  allNonRooms,
  nonAssignedChats,
  assignAgentToNonChat,
  assignToAdmin,
  deleteNonChat,
  unseenmessagescountnn,
} = require('../controllers/nonchat.controller');
const {
  updateTimeNonChat,
  createNonChatConfig,
  updateShowNonChat,
  updateResponseMessagesNonChat,
  getNonChatConfig,
} = require('../controllers/nonchatconfig.controller');
const AdminModel = require('../models/Admin.model');

const router = express.Router();

router.get('/nonroom/:roomID', async (req, res) => {
  const roomID = req.params.roomID;
  try {
    const result = await findAllMessagesByNonRoom(roomID);
    if (result) {
      return res.send(result);
    } else {
      res.status(400).send('No NonRoom');
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

// router.get('/lastmessage/:roomID', async (req, res) => {
//   const roomID = req.params.roomID;
//   try {
//     const result = await isLastMessage(roomID);
//     res.send(result);
//   } catch (error) {
//     console.log(error);
//     res.status(400).send(error);
//   }
// });

// router.post('/lastmessage/:roomID', async (req, res) => {
//   const roomID = req.params.roomID;
//   try {
//     const result = await seeLastMessage(roomID);

//     console.log(true);

//     res.send(result);
//   } catch (error) {
//     console.log(error);
//     res.status(400).send(error);
//   }
// });

router.get('/nonrooms', async (req, res) => {
  try {
    const result = await allNonRooms();

    return res.send(result);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});
router.get('/nonassignedchats', async (req, res) => {
  try {
    const result = await nonAssignedChats();
    return res.send(result);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});
router.post('/assignAgentToNonChat', async (req, res) => {
  const { roomID, agentID, roleID } = req.body;
  console.log(req.body);
  try {
    const result = await assignAgentToNonChat(roomID, agentID, roleID);
    return res.send(result);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});
router.post('/assignToAdmin', async (req, res) => {
  const { roomID, agentID } = req.body;
  try {
    const result = await assignToAdmin(roomID, agentID);
    return res.send(result);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});
router.post('/deleteNonChat', async (req, res) => {
  const { roomID } = req.body;
  try {
    const result = await deleteNonChat(roomID);
    return res.send(result);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.get('/last24nonchats', async (req, res) => {
  try {
    // const hourCount = await last24hoursChat();
    const hourCount = 0;
    const unseenCount = await unseenmessagescountnn();

    return res.send({ hourCount, unseenCount });
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.get('/createNonChatConfig', async (req, res) => {
  try {
    const result = await createNonChatConfig();
    if (result) {
      return res.send(result);
    } else {
      res.status(400).send('Error');
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post('/updateTimeNonChat', async (req, res) => {
  const { time } = req.body;
  try {
    const result = await updateTimeNonChat(time);
    if (result) {
      return res.send(true);
    } else {
      res.status(400).send('Error');
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post('/updateShowNonChat', async (req, res) => {
  const { show } = req.body;
  try {
    const result = await updateShowNonChat(show);
    if (result) {
      return res.send(true);
    } else {
      res.status(400).send('Error');
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post('/updateResponseMessagesNonChat', async (req, res) => {
  const { responseMessages } = req.body;
  try {
    const result = await updateResponseMessagesNonChat(responseMessages);
    if (result) {
      return res.send(true);
    } else {
      res.status(400).send('Error');
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/getNonChatConfig', async (req, res) => {
  try {
    const result = await getNonChatConfig();
    if (result) {
      return res.send(result);
    } else {
      res.status(400).send('Error');
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

// router.get('/last2drooms', async (req, res) => {
//   try {
//     const result = await last2DayRooms();
//     const userIds = result.map((el) => el.userID);

//     let userNames = await AdminModel.find({
//       userId: { $in: userIds },
//     })
//       .select('username userId -_id')
//       .lean();

//     const finalData = result.map((el) => {
//       const user = userNames.find((username) => username.userId === el.userID);
//       if (user) {
//         return {
//           ...el._doc,
//           username: user.username,
//         };
//       }
//       return {
//         ...el._doc,
//         username: el.userID.split('@')[0],
//       };
//     });

//     return res.send(finalData);
//   } catch (error) {
//     console.log(error);
//     res.status(400).send(error);
//   }
// });
// router.get('/last24chats', async (req, res) => {
//   try {
//     const hourCount = await last24hoursChat();
//     const unseenCount = await unseenmessagescount();

//     return res.send({ hourCount, unseenCount });
//   } catch (error) {
//     console.log(error);
//     res.status(400).send(error);
//   }
// });
// router.get('/user/:userID', async (req, res) => {
//   const user = req.params.userID;
//   try {
//     const result = await findRoomIDByUser(user);
//     res.send(result);
//   } catch (error) {
//     console.log(error);
//     res.status(400).send(error);
//   }
// });

// router.get('/agents', async (req, res) => {
//   try {
//     const result = await findAgents();
//     res.send(result);
//   } catch (error) {
//     console.log(error);
//     res.status(400).send(error);
//   }
// });
// router.post('/agents', async (req, res) => {
//   console.log(req.body);
//   const { roomID, agentID } = req.body;
//   try {
//     if (roomID && agentID) {
//       const result = await updateAgentInChatRoom(roomID, agentID);
//       res.send(result.userID);
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(400).send(error);
//   }
// });

module.exports = router;
