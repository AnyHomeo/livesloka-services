const express = require("express") 
const {
    findAllMessagesByRoom,
    allRooms,
    findRoomIDByUser,
    findAgents,
    updateAgentInChatRoom,
} = require("../controllers/chat.controller")

const router = express.Router()

router.get("/rooms/:roomID", async (req, res) => {
    const roomID = req.params.roomID
    try {
        const result = await findAllMessagesByRoom(roomID)
        res.send(result)
    } catch (error) {
        console.log(error)
        res.status(400).send(error)
    }
})

router.get("/rooms", async (req, res) => {
    try {
        const result = await allRooms()
        res.send(result)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.get("/user/:userID", async (req, res) => {
    const user = req.params.userID
    try {
        const result = await findRoomIDByUser(user)
        res.send(result)
    } catch (error) {
        console.log(error)
        res.status(400).send(error)
    }
})

router.get("/agents", async (req, res) => {
    try {
        const result = await findAgents()
        res.send(result)
    } catch (error) {
        console.log(error)
        res.status(400).send(error)
    }
})
router.post("/agents", async (req, res) => {
    console.log(req.body)
    const {roomID, agentID} = req.body
    try {
        if (roomID && agentID) {
            const result = await updateAgentInChatRoom(roomID, agentID)
            res.send(result.userID)
        }
    } catch (error) {
        console.log(error)
        res.status(400).send(error)
    }
})

module.exports = router