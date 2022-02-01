const { NonRoomConfig } = require('../models/nonchatconfig.model');

const createNonChatConfig = async () => {
  const count = await NonRoomConfig.count();
  console.log(count);
  if (!!count) {
    return 'exists';
  } else {
    const chatConfig = new NonRoomConfig({
      show: false,
      time: 5,
      responseMessages: ['hi', 'hello'],
    });
    return await chatConfig.save();
  }
};

const updateTimeNonChat = async (time) => {
  return await NonRoomConfig.update({}, { time });
};

const updateShowNonChat = async (show) => {
  return await NonRoomConfig.update({}, { show });
};
const updateShowBot = async (bot) => {
  return await NonRoomConfig.update({}, { bot });
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
  updateShowBot,
};
