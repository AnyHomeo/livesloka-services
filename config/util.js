const ClassHistoryModel = require('../models/ClassHistory.model');
const CustomerModel = require('../models/Customer.model');
const TeacherModel = require('../models/Teacher.model');
const ZoomAccountModel = require('../models/ZoomAccount.model');
const fetch = require('node-fetch');
const equal = require('fast-deep-equal');
const SchedulerModel = require('../models/Scheduler.model');
const Payments = require('../models/Payments');
const momentTZ = require('moment-timezone');
const days = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const createZoomLink = async (slots) => {
  try {
    // select a zoom account which doesn't have slots yet
    const selectedZoomAccount = await ZoomAccountModel.findOne({
      timeSlots: {
        $nin: slots,
      },
      isDisabled: { $ne: true },
    }).sort({ createdAt: -1 });

    if (selectedZoomAccount) {
      const { zoomPassword, zoomEmail, zoomJwt } = selectedZoomAccount;

      // create new zoomlink
      const formData = {
        topic: 'Livesloka Online Class',
        type: 3,
        password: zoomPassword,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          jbh_time: 0,
          mute_upon_entry: true,
          watermark: false,
          use_pmi: false,
          approval_type: 2,
          audio: 'both',
          auto_recording: 'none',
          waiting_room: false,
          meeting_authentication: false,
        },
      };

      let data = await fetch(
        `https://api.zoom.us/v2/users/${zoomEmail}/meetings`,
        {
          method: 'post',
          body: JSON.stringify(formData),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${zoomJwt}`,
          },
        }
      );

      let response = await data.json();
      selectedZoomAccount.timeSlots = [
        ...selectedZoomAccount.timeSlots,
        ...slots,
      ];
      await selectedZoomAccount.save();

      return {
        meetingAccount: selectedZoomAccount._id,
        link: response.join_url,
      };
    } else {
      return 'Zoom account not available';
    }
  } catch (error) {
    console.error(error);
    return error.message;
  }
};

const checkAccountAvailability = async (slots) => {
  try {
    let isAccountsAvailable = true;
    for (const day in slots) {
      if (Object.hasOwnProperty.call(slots, day)) {
        const daySlots = slots[day];
        const zoomAccount = await ZoomAccountModel.countDocuments({
          timeSlots: {
            $nin: daySlots,
          },
          isDisabled: { $ne: true },
        }).sort({ createdAt: -1 });
        if (!zoomAccount) {
          isAccountsAvailable = false;
          break;
        }
      }
    }
    return isAccountsAvailable;
  } catch (error) {
    logError(error, 'UTILS');
    return false;
  }
};

const createSlotsZoomLink = async (slots) => {
  try {
    let meetingLinks = {};
    let days = Object.keys(slots);

    let isAccountsAvailable = checkAccountAvailability(slots);

    if (isAccountsAvailable) {
      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        let daySlots = slots[day];
        if (daySlots.length) {
          let response = await createZoomLink(daySlots);
          if (typeof response === 'string') {
            return new Error(response);
          } else {
            meetingLinks[day] = response;
          }
        }
      }

      return meetingLinks;
    } else {
      throw new Error('Zoom accounts not available');
    }
  } catch (error) {
    logError(error, 'UTILS');
    return new Error(error.message);
  }
};

const generateSlots = (requestBody) => {
  let { monday, tuesday, wednesday, thursday, friday, saturday, sunday } =
    requestBody;

  monday = monday || [];
  tuesday = tuesday || [];
  wednesday = wednesday || [];
  thursday = thursday || [];
  friday = friday || [];
  saturday = saturday || [];
  sunday = sunday || [];

  return [
    {
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
    },
    [
      ...monday,
      ...tuesday,
      ...wednesday,
      ...thursday,
      ...friday,
      ...saturday,
      ...sunday,
    ],
  ];
};

const updateCustomersWithSchedule = async (schedule) => {
  const { students } = schedule;
  try {
    for (let i = 0; i < students.length; i++) {
      const studentId = students[i];
      const customer = await CustomerModel.findById(studentId);
      const previousValue = customer.numberOfClassesBought;
      const nextValue = schedule.demo
        ? customer.numberOfClassesBought + 1
        : customer.numberOfClassesBought;

      // update class history of student incase if its demo
      if (previousValue !== nextValue) {
        let newUpdate = new ClassHistoryModel({
          previousValue,
          nextValue,
          comment: 'Scheduled a Demo class',
          customerId: customer._id,
        });
        await newUpdate.save();
      }

      customer.teacherId = schedule.teacher;
      customer.numberOfClassesBought = nextValue;
      customer.classStatusId = schedule.demo
        ? '38493085684944'
        : '121975682530440';
      await customer.save();
    }
  } catch (error) {
    logError(error, 'UTILS');
  }
};

const updateTeacherWithSchedule = async (schedule) => {
  try {
    const teacher = await TeacherModel.findOne({ id: schedule.teacher });
    let { availableSlots } = teacher;
    const [_, allSlots] = generateSlots(schedule.slots);

    allSlots.forEach((slot) => {
      let index = availableSlots.indexOf(slot);
      teacher.availableSlots.splice(index, 1);
      teacher.scheduledSlots.push(slot);
    });

    teacher.availableSlots = [...new Set(teacher.availableSlots)];
    teacher.scheduledSlots = [...new Set(teacher.scheduledSlots)];
    await teacher.save();
  } catch (error) {
    throw new Error('Error while updating teacher slots');
  }
};

const updateOldTeacherByRemovingOldSlots = async (teacherId, oldSlots) => {
  const oldTeacher = await TeacherModel.findOne({ id: teacherId });
  const [_, allSlots] = generateSlots(oldSlots);

  oldTeacher.availableSlots = oldTeacher.availableSlots.concat(allSlots);
  oldTeacher.availableSlots = [...new Set(oldTeacher.availableSlots)];
  let allScheduledSlotsOfTeacher = [...oldTeacher.scheduledSlots];
  allScheduledSlotsOfTeacher.forEach((slot) => {
    if (allSlots.includes(slot)) {
      let index = oldTeacher.scheduledSlots.indexOf(slot);
      oldTeacher.scheduledSlots.splice(index, 1);
    }
  });
  oldTeacher.scheduledSlots = [...oldTeacher.scheduledSlots];
  await oldTeacher.save();
};

const findIfNewMeetingLinkNeeded = async (
  scheduleId,
  slots,
  isMeetingLinkChangeNeeded
) => {
  const schedule = await SchedulerModel.findById(scheduleId).lean();

  let oldScheduleSlots = Object.keys(schedule.slots).map((day) =>
    schedule.slots[day].sort()
  );

  let newSlots = Object.keys(slots).map((day) => slots[day].sort());
  return !equal(oldScheduleSlots, newSlots) || isMeetingLinkChangeNeeded;
};

const deleteMeetingFromZoom = async (
  meetingLink,
  meetingAccount,
  slots,
  stopSlots
) => {
  try {
    const account = await ZoomAccountModel.findById(meetingAccount);
    if (account && meetingLink) {
      const { zoomJwt } = account;
      try {
        let res = await fetch(
          `https://api.zoom.us/v2/meetings/${
            meetingLink.split('/')[4].split('?')[0]
          }`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${zoomJwt}`,
            },
          }
        );
      } catch (error) {
        logError(error, 'UTILS');
      }
      if (!stopSlots) {
        slots.forEach((slot) => {
          let slotIndex = account.timeSlots.indexOf(slot);
          if (slotIndex !== -1) {
            account.timeSlots.splice(slotIndex, 1);
          }
        });
        await account.save();
      }
    }
  } catch (error) {
    logError(error, 'UTILS');
  }
};

const deleteExistingZoomLinkOfTheSchedule = async (schedule, stopSlots) => {
  try {
    const { meetingLink, meetingAccount, meetingLinks } = schedule;
    if (meetingLink && meetingAccount) {
      const [_, allSlots] = generateSlots(schedule.slots);
      await deleteMeetingFromZoom(
        meetingLink,
        meetingAccount,
        allSlots,
        stopSlots
      );
    }
    let days = Object.keys(meetingLinks);
    for (let o = 0; o < days.length; o++) {
      const day = days[o];
      if (meetingLinks[day]) {
        const { meetingAccount, link } = meetingLinks[day];
        await deleteMeetingFromZoom(
          link,
          meetingAccount,
          schedule.slots[day],
          stopSlots
        );
      }
    }
  } catch (error) {
    logError(error, 'UTILS');
  }
};

const updateCustomerWithUpdatedSchedule = async (oldSchedule, newSchedule) => {
  // find if new students are added
  const newScheduleStudents = newSchedule.students.map((student) =>
    student.toString()
  );
  const newStudents = oldSchedule.students.reduce(
    (studentsAccumulator, student) => {
      if (newScheduleStudents.includes(student.toString())) {
        studentsAccumulator.push(student.toString());
      }
      return studentsAccumulator;
    },
    []
  );

  for (let i = 0; i < newScheduleStudents.length; i++) {
    const customerId = newScheduleStudents[i];
    const customer = await CustomerModel.findById(customerId);
    const anyPayments = await Payments.countDocuments({
      customerId,
    });
    const needToAddOneClass =
      (newSchedule.demo && newStudents.includes(customerId)) ||
      (newSchedule.demo && !oldSchedule.demo);

    let previousValue = customer.numberOfClassesBought;
    let nextValue = needToAddOneClass
      ? customer.numberOfClassesBought + 1
      : customer.numberOfClassesBought;

    if (previousValue !== nextValue) {
      let newUpdate = new ClassHistoryModel({
        previousValue,
        nextValue,
        comment: 'Scheduled a Demo class',
        customerId,
      });
      await newUpdate.save();
    }

    await CustomerModel.updateOne(
      { _id: customerId },
      {
        $set: {
          teacherId: newSchedule.teacher,
          numberOfClassesBought: nextValue,
          classStatusId: newSchedule.demo
            ? '38493085684944'
            : anyPayments
            ? '113975223750050'
            : '121975682530440',
        },
      }
    );
  }
};

const retrieveMeetingLink = (schedule) => {
  const { meetingLink, meetingLinks } = schedule;
  const day = momentTZ().tz('Asia/Kolkata').format('dddd').toLowerCase();
  if (typeof meetingLinks === 'object' && Object.keys(meetingLinks).length) {
    if (meetingLinks[day].link) {
      return meetingLinks[day].link;
    } else {
      let link;
      let dayIndex = days.indexOf(day);
      if (dayIndex !== -1) {
        let nextDaysOrder = [
          ...days.slice(dayIndex + 1),
          ...days.slice(0, dayIndex),
        ];
        for (let i = 0; i < nextDaysOrder.length; i++) {
          const nextDay = nextDaysOrder[i];
          if (meetingLinks[nextDay].link) {
            link = meetingLinks[nextDay].link;
            break;
          }
        }
        return link;
      } else {
        return '';
      }
    }
  } else {
    return meetingLink || '';
  }
};

module.exports = {
  createZoomLink,
  createSlotsZoomLink,
  generateSlots,
  updateCustomersWithSchedule,
  updateTeacherWithSchedule,
  updateOldTeacherByRemovingOldSlots,
  findIfNewMeetingLinkNeeded,
  deleteExistingZoomLinkOfTheSchedule,
  updateCustomerWithUpdatedSchedule,
  retrieveMeetingLink,
};
