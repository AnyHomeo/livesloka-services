const { NonRoomConfig } = require('../models/nonchatconfig.model');

const createNonChatConfig = async () => {
  const chatConfig = new NonRoomConfig({
    show: false,
    time: 5,
    responseMessages: ['hi', 'hello'],
  });
  return await chatConfig.save();
};

const updateTimeNonChat = async (time) => {
  return await NonRoomConfig.update({}, { time });
};

const updateShowNonChat = async (show) => {
  return await NonRoomConfig.update({}, { show });
};

const updateResponseMessagesNonChat = async (responseMessages) => {
  return await NonRoomConfig.update({}, { responseMessages });
};

const getNonChatConfig = async () => {
  return await NonRoomConfig.find();
};

module.exports = {
  updateTimeNonChat,
  createNonChatConfig,
  updateShowNonChat,
  updateResponseMessagesNonChat,
  getNonChatConfig,
};
