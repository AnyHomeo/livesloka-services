const ZoomAccountModel = require('../models/ZoomAccount.model');
const fetch = require('node-fetch');
const { createSlotsZoomLink } = require('../config/util');
const SchedulerModel = require('../models/Scheduler.model');

const deleteAllZoomLinksOfAnAccount = async (account) => {
  try {
    const { zoomJwt, zoomEmail } = account;
    let res = await fetch(
      `https://api.zoom.us/v2/users/${zoomEmail}/meetings?page_size=300`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${zoomJwt}`,
        },
      }
    );
    res = await res.json();
    for (let i = 0; i < res.meetings.length; i++) {
      const meeting = res.meetings[i].join_url;
      let deletedResponse = await fetch(
        `https://api.zoom.us/v2/meetings/${
          meeting.split('/')[4].split('?')[0]
        }`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${zoomJwt}`,
          },
        }
      );
    }
  } catch (error) {
    console.log(error);
    return error;
  }
};

exports.deleteZoomLinks = async (req, res) => {
  try {
    const accounts = await ZoomAccountModel.find({})
      .skip(3)
      .sort({ createdAt: -1 })
      .lean();
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      console.log(account.ZoomAccountName);
      await deleteAllZoomLinksOfAnAccount(account);
    }
    await ZoomAccountModel.update({}, { $set: { timeSlots: [] } });
    await SchedulerModel.update(
      {},
      { $unset: { meetingLink: 1, meetingLinks: 1 } },
      { multi: true }
    );
    return res.json({
      message: 'Deleted all zoom links successfully',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error });
  }
};

exports.createZoomLinks = async (req, res) => {
  try {
    const schedules = await SchedulerModel.find({
      isDeleted: { $ne: true },
    });
    for (let i = 0; i < schedules.length; i++) {
      const schedule = schedules[i];
      const { slots } = schedule;
      console.log(schedule.className);
      const meetingLinks = await createSlotsZoomLink(slots);
      schedule.startDate = schedule.createdAt;
      schedule.meetingLinks = meetingLinks;
      await schedule.save();
      console.log('saved');
    }

    return res.status(200).json({
      message: 'Meeting Links Updated successfully!',
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: err.message || 'something went wrong',
    });
  }
};
