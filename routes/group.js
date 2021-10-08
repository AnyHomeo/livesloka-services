const express = require('express');
const {
  findAllUsers,
  createNewGroup,
  allGroups,
  findAllMessagesByGroup,
  getGroupByRole,
  findGroupDetails,
  updateGroup,
  closeGroup,
  deleteGroup,
  findInClassCustomers,
  findGroupsByCustomerEmail,
} = require('../controllers/group.controller');
// const AdminModel = require('../models/Admin.model');

const router = express.Router();

router.get('/allUsers', async (req, res) => {
  try {
    const result = await findAllUsers();
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.get('/findInClassCustomers', async (req, res) => {
  try {
    const result = await findInClassCustomers();
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post('/create-group', async (req, res) => {
  const body = req.body;

  try {
    const result = await createNewGroup(body);
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post('/update-group', async (req, res) => {
  const body = req.body;

  try {
    await updateGroup(body);
    res.send(true);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});
router.post('/closeGroup', async (req, res) => {
  const body = req.body;

  try {
    await closeGroup(body);
    res.send(true);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});
router.post('/deleteGroup', async (req, res) => {
  const body = req.body;

  try {
    await deleteGroup(body);
    res.send(true);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.get('/allgroups', async (req, res) => {
  try {
    const result = await allGroups();
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.get('/customerGroups/:email', async (req, res) => {
  const email = req.params.email;
  console.log(email);
  try {
    const result = await findGroupsByCustomerEmail(email);
    console.log(result);
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.get('/groups/:groupID', async (req, res) => {
  const groupID = req.params.groupID;
  try {
    const result = await findAllMessagesByGroup(groupID);
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});
router.get('/groupByRole/:roleID/:userID', async (req, res) => {
  const { roleID, userID } = req.params;
  try {
    const result = await getGroupByRole(roleID, userID);
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.get('/groupInfo/:groupID', async (req, res) => {
  const groupID = req.params.groupID;
  try {
    const result = await findGroupDetails(groupID);
    res.send(result);
  } catch (error) {
    console.log(error);
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

// router.get('/rooms', async (req, res) => {
//   try {
//     const result = await allRooms();
//     const userIds = result.map((el) => el.userID);
//     console.log('result =>', result);

//     let userNames = await AdminModel.find({
//       userId: { $in: userIds },
//     })
//       .select('username userId -_id')
//       .lean();

//     console.log('userNames =>', userNames);
//     const finalData = result.map((el) => {
//       const user = userNames.find((username) => username.userId === el.userID);
//       console.log({ ...el._doc }, user);
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
