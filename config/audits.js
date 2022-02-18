
const addSchedule = async (req, res) => {
    let {
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
      meetingLink,
      meetingAccount,
      teacher,
      students,
      demo,
      OneToOne,
      OneToMany,
      startDate,
      subject,
      classname,
      isZoomMeeting,
      isSummerCampClass,
      summerCampAmount,
      summerCampTitle,
      summerCampDescription,
      summerCampSchedule,
      summerCampImage,
      summerCampStudentsLimit,
      summerCampClassNumberOfDays,
    } = req.body;
  
    let slotees = {
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
    };
    monday = monday ? monday : [];
    tuesday = tuesday ? tuesday : [];
    wednesday = wednesday ? wednesday : [];
    thursday = thursday ? thursday : [];
    friday = friday ? friday : [];
    saturday = saturday ? saturday : [];
    sunday = sunday ? sunday : [];
    let className = "";
    let wherebyMeetingId = undefined;
    let wherebyHostUrl = undefined;
    if (isZoomMeeting) {
      meetingLink = meetingLink.startsWith("http")
        ? meetingLink
        : "https://" + meetingLink;
    } else {
      try {
        const data = {
          startDate: moment().format(),
          endDate: moment().add(1, "year").format(),
          roomMode: "group",
          roomNamePattern: "human-short",
          fields: ["hostRoomUrl"],
        };
        meetingLinkData = await fetch("https://api.whereby.dev/v1/meetings", {
          method: "post",
          headers: {
            Authorization: `Bearer ${process.env.WHEREBY_API_KEY}`,
            "Content-type": "application/json",
            Accept: "application/json",
            "Accept-Charset": "utf-8",
          },
          body: JSON.stringify(data),
        });
        meetingLinkData = await meetingLinkData.json();
        wherebyMeetingId = meetingLinkData.meetingId;
        wherebyHostUrl = meetingLinkData.hostRoomUrl;
        meetingLink = meetingLinkData.roomUrl;
      } catch (error) {
        console.log(error);
        return res.status(500).json("Error in Whereby Meeting Generation");
      }
    }
    try {
      let selectedSubject = await Subject.findOne({ _id: subject }).lean();
      var selectedTeacher = await Teacher.findOne({ id: teacher }).lean();
      if (classname) {
        className = classname;
      } else {
        className = `${selectedSubject.subjectName} ${
          selectedTeacher.TeacherName
        } ${startDate} ${demo ? "Demo" : ""}`;
      }
    } catch (error) {
      console.log(error);
      return res.status(400).json({
        error: "Can't Add className",
      });
    }
    let scheduleDescription = scheduleDescriptionGenerator(slotees);
    const schedule = new Schedule({
      meetingAccount,
      meetingLink,
      teacher,
      students,
      startDate,
      slots: {
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
        sunday,
      },
      demo,
      OneToOne,
      OneToMany,
      className,
      subject,
      scheduleDescription,
      wherebyHostUrl,
      wherebyMeetingId,
      isZoomMeeting,
      isSummerCampClass,
      summerCampAmount,
      summerCampTitle,
      summerCampDescription,
      summerCampSchedule,
      summerCampImage,
      summerCampStudentsLimit,
      summerCampClassNumberOfDays,
    });
  
    schedule
      .save()
      .then(async (scheduledData) => {
        let allSlots = [
          ...monday,
          ...tuesday,
          ...wednesday,
          ...thursday,
          ...friday,
          ...saturday,
          ...sunday,
        ];
        if (isZoomMeeting) {
          ZoomAccountModel.findById(meetingAccount)
            .then(async (zoomAccountData) => {
              zoomAccountData.timeSlots = [
                ...zoomAccountData.timeSlots,
                ...allSlots,
              ];
              try {
                await zoomAccountData.save();
              } catch (error) {
                console.log(error);
                return res.status(500).json({
                  error: "error in saving zoom account",
                });
              }
            })
            .catch((err) => {
              console.log(err);
            });
        }
  
        let Subjectname = "";
        Subject.findOne({ _id: scheduledData.subject })
          .then((subject) => {
            Subjectname = Subjectname + subject.subjectName;
          })
          .catch((error) => {
            console.log(error);
          });
  
        for (x = 0; x < students.length; x++) {
          Customer.findOne({ _id: students[x] })
            .then(async (data) => {
              let stud_id = data._id;
              let { timeZoneId } = data;
              timzone
                .findOne({ id: timeZoneId })
                .then(async (dat) => {
                  let rec = SlotConverter(scheduledData.slots, dat.timeZoneName);
                  let schdDescription = postProcess(rec, Subjectname);
                  let previousValue = data.numberOfClassesBought;
                  let nextValue = demo
                    ? data.numberOfClassesBought + 1
                    : data.numberOfClassesBought;
                  if (previousValue !== nextValue) {
                    let newUpdate = new ClassHistoryModel({
                      previousValue,
                      nextValue,
                      comment: "Scheduled a Demo class",
                      customerId: stud_id,
                    });
                    await newUpdate.save();
                  }
                  await Customer.updateOne(
                    { _id: stud_id },
                    {
                      $set: {
                        scheduleDescription: schdDescription,
                        meetingLink,
                        teacherId: selectedTeacher.id,
                        classStatusId: demo
                          ? "38493085684944"
                          : "121975682530440",
                      },
                      numberOfClassesBought: demo
                        ? data.numberOfClassesBought + 1
                        : data.numberOfClassesBought,
                    }
                  );
                })
                .catch((err) => {
                  console.log(err);
                });
            })
            .catch((error) => {
              console.log(error);
            });
        }
  
        Teacher.findOne({ id: teacher }).then((data) => {
          if (data) {
            let { availableSlots } = data;
            if (availableSlots) {
              Object.keys(scheduledData.slots).forEach((day) => {
                let arr = scheduledData.slots[day];
                arr.forEach((slot) => {
                  let index = availableSlots.indexOf(slot);
                  data.availableSlots.splice(index, 1);
                  data.scheduledSlots.push(slot);
                });
              });
            }
            data.availableSlots = [...new Set(data.availableSlots)];
            data.scheduledSlots = [...new Set(data.scheduledSlots)];
            data.save((err, docs) => {
              if (err) {
                console.log(err);
                return res.status(500).json({
                  error: "error in updating teacher slots",
                });
              } else {
                return res.json({
                  message: "schedule saved successfully",
                });
              }
            });
          }
        });
      })
      .catch((err) => {
        if (
          err.errors &&
          err.errors[Object.keys(err.errors)[0]].properties &&
          err.errors[Object.keys(err.errors)[0]].properties.message
        ) {
          return res.status(500).json({
            error: err.errors[Object.keys(err.errors)[0]].properties.message,
          });
        }
        console.log(err);
        return res.status(500).json({
          error: "Error in saving the schedule",
        });
      });
  };

const editSchedule = async (req, res) => {
    try {
      const { scheduleId: id } = req.params;
      let {
        teacher,
        students,
        startDate,
        slots,
        demo,
        subject,
        className,
        meetingAccount,
        isMeetingLinkChangeNeeded,
      } = req.body;
  
      let slotschange = {
        monday: req.body.slots.monday,
        tuesday: req.body.slots.tuesday,
        wednesday: req.body.slots.wednesday,
        thursday: req.body.slots.thursday,
        friday: req.body.slots.friday,
        saturday: req.body.slots.saturday,
        sunday: req.body.slots.sunday,
      };
  
      try {
        let selectedSubject = await Subject.findOne({ _id: subject }).lean();
        var selectedTeacher = await Teacher.findOne({ id: teacher }).lean();
        if (className) {
          req.body.className = className;
        } else {
          req.body.className = `${selectedSubject.subjectName} ${
            selectedTeacher.TeacherName
          } ${startDate} ${demo ? "Demo" : ""}`;
        }
      } catch (error) {
        console.log(error);
        return res.status(400).json({
          error: "Can't Add className",
        });
      }
  
      let scheduleDescription = scheduleDescriptionGenerator(slotschange);
      const oldSchedule = await Schedule.findOne({ _id: id }).lean();
      let oldTeacher = await TeacherModel.findOne({ id: oldSchedule.teacher });
  
      let oldScheduleSlots = Object.keys(oldSchedule.slots).map((day) =>
        oldSchedule.slots[day].sort()
      );
      let newSlots = Object.keys(slots).map((day) => slots[day].sort());
      let isNewMeetingLinkNeeded =
        !equal(oldScheduleSlots, newSlots) || isMeetingLinkChangeNeeded;
      let { monday, tuesday, wednesday, thursday, friday, saturday, sunday } =
        oldSchedule.slots;
      let allSlots = [
        ...monday,
        ...tuesday,
        ...wednesday,
        ...thursday,
        ...friday,
        ...saturday,
        ...sunday,
      ];
      let newStudents = students
        .filter(
          (student) =>
            !oldSchedule.students.filter((oldStudent) =>
              oldStudent.equals(student)
            ).length
        )
        .map((student) => student.toString());
  
      oldTeacher.availableSlots = oldTeacher.availableSlots.concat(allSlots);
      oldTeacher.availableSlots = [...new Set(oldTeacher.availableSlots)];
      let allScheduledSlotsOfTeacher = [...oldTeacher.scheduledSlots];
      allScheduledSlotsOfTeacher.forEach((slot) => {
        if (allSlots.includes(slot)) {
          let index = oldTeacher.scheduledSlots.indexOf(slot);
          oldTeacher.scheduledSlots.splice(index, 1);
        }
      });
  
      await oldTeacher.save();
      if (isNewMeetingLinkNeeded) {
        ZoomAccountModel.findOne(
          { _id: meetingAccount, isDisabled: { $ne: true } },
          async (err, data) => {
            if (err) {
              console.log(err);
            }
            if (data) {
              allSlots.forEach((slot) => {
                let slotIndex = data.timeSlots.indexOf(slot);
                if (slotIndex != -1) {
                  data.timeSlots.splice(slotIndex, 1);
                }
              });
              await data.save();
            }
  
            let {
              monday,
              tuesday,
              wednesday,
              thursday,
              friday,
              saturday,
              sunday,
            } = slots;
            let availableZoomAccount = await ZoomAccountModel.findOne({
              timeSlots: {
                $nin: [
                  ...monday,
                  ...tuesday,
                  ...wednesday,
                  ...thursday,
                  ...friday,
                  ...saturday,
                  ...sunday,
                ],
              },
            });
            if (!availableZoomAccount) {
              throw Error("no Zoom Account!");
            }
            const { _id, zoomEmail, zoomJwt, zoomPassword } =
              availableZoomAccount;
            const { meetingLink } = oldSchedule;
            if (meetingLink && meetingLink.includes("zoom")) {
              await fetch(
                `https://api.zoom.us/v2/meetings/${
                  meetingLink.split("/")[4].split("?")[0]
                }`,
                {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${zoomJwt}`,
                  },
                }
              );
            }
            const formData = {
              topic: "Livesloka Online Class",
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
                audio: "both",
                auto_recording: "none",
                waiting_room: false,
                meeting_authentication: false,
              },
            };
            fetch(`https://api.zoom.us/v2/users/${zoomEmail}/meetings`, {
              method: "post",
              body: JSON.stringify(formData),
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${zoomJwt}`,
              },
            })
              .then((res) => res.json())
              .then((json) => {
                if (json.code === 1001) {
                  return res.status(400).json({
                    message: "Error while creating meeting link",
                  });
                }
                req.body.meetingLink = json.join_url;
                req.body.meetingAccount = _id;
                Schedule.updateOne(
                  { _id: id },
                  { ...req.body, scheduleDescription },
                  (err, response) => {
                    if (err) {
                      return res.status(500).json({
                        error: "Error in updating schedule",
                      });
                    }
                    ZoomAccountModel.findById(req.body.meetingAccount)
                      .then(async (data) => {
                        data.timeSlots = [
                          ...data.timeSlots,
                          ...monday,
                          ...tuesday,
                          ...wednesday,
                          ...thursday,
                          ...friday,
                          ...saturday,
                          ...sunday,
                        ];
  
                        await ZoomAccountModel.updateOne(
                          { _id: req.body.meetingAccount },
                          { timeSlots: data.timeSlots }
                        );
                      })
                      .catch((err) => {
                        console.log(err);
                      });
                    let Subjectname = "";
                    Subject.findOne({ _id: subject })
                      .then((subject) => {
                        Subjectname = Subjectname + subject.subjectName;
                      })
                      .catch((error) => {
                        console.log(error);
                      });
                    for (x = 0; x < students.length; x++) {
                      Customer.findOne({ _id: students[x] })
                        .then((data) => {
                          let stud_id = data._id;
                          let { timeZoneId } = data;
                          timzone
                            .findOne({ id: timeZoneId })
                            .then(async (dat) => {
                              let rec = SlotConverter(slots, dat.timeZoneName);
                              let schdDescription = postProcess(rec, Subjectname);
                              let anyPayments = await Payments.countDocuments({
                                customerId: data._id,
                              });
                              let previousValue = data.numberOfClassesBought;
                              let nextValue =
                                (demo &&
                                  newStudents.includes(stud_id.toString())) ||
                                (demo && !oldSchedule.demo)
                                  ? data.numberOfClassesBought + 1
                                  : data.numberOfClassesBought;
                              if (previousValue !== nextValue) {
                                let newUpdate = new ClassHistoryModel({
                                  previousValue,
                                  nextValue,
                                  comment: "Scheduled a Demo class",
                                  customerId: stud_id,
                                });
                                await newUpdate.save();
                              }
                              await Customer.updateOne(
                                { _id: stud_id },
                                {
                                  $set: {
                                    scheduleDescription: schdDescription,
                                    meetingLink: req.body.meetingLink,
                                    teacherId: selectedTeacher.id,
                                    numberOfClassesBought:
                                      (demo &&
                                        newStudents.includes(
                                          stud_id.toString()
                                        )) ||
                                      (demo && !oldSchedule.demo)
                                        ? data.numberOfClassesBought + 1
                                        : data.numberOfClassesBought,
                                    classStatusId: demo
                                      ? "38493085684944"
                                      : anyPayments
                                      ? "113975223750050"
                                      : "121975682530440",
                                  },
                                }
                              );
                            })
                            .catch((err) => {
                              console.log(err);
                            });
                        })
                        .catch((error) => {
                          console.log(error);
                        });
                    }
                    Teacher.findOne({ id: teacher })
                      .then((data) => {
                        if (data) {
                          let { availableSlots } = data;
                          if (availableSlots) {
                            Object.keys(slots).forEach((day) => {
                              let arr = slots[day];
                              arr.forEach((slot) => {
                                let index = availableSlots.indexOf(slot);
                                if (index != -1) {
                                  data.availableSlots.splice(index, 1);
                                }
                                data.scheduledSlots.push(slot);
                              });
                            });
                          }
                          data.availableSlots = [...new Set(data.availableSlots)];
                          data.scheduledSlots = [...new Set(data.scheduledSlots)];
                          data.save((err, docs) => {
                            if (err) {
                              console.log(err);
                              return res.status(500).json({
                                error: "error in updating teacher slots",
                              });
                            } else {
                              return res.json({
                                message: "schedule updated successfully",
                              });
                            }
                          });
                        }
                      })
                      .catch((err) => {
                        console.log(err);
                        return res.status(400).json({
                          error:
                            "error in updating students Links and Description",
                        });
                      });
                  }
                );
              });
          }
        );
      } else {
        Schedule.updateOne(
          { _id: id },
          { ...req.body, scheduleDescription },
          (err, response) => {
            if (err) {
              return res.status(500).json({
                error: "Error in updating schedule",
              });
            }
            let Subjectname = "";
            Subject.findOne({ _id: subject })
              .then((subject) => {
                Subjectname = Subjectname + subject.subjectName;
              })
              .catch((error) => {
                console.log(error);
              });
            for (x = 0; x < students.length; x++) {
              Customer.findOne({ _id: students[x] })
                .then((data) => {
                  let stud_id = data._id;
                  let { timeZoneId } = data;
  
                  timzone
                    .findOne({ id: timeZoneId })
                    .then(async (dat) => {
                      let rec = SlotConverter(slots, dat.timeZoneName);
                      let schdDescription = postProcess(rec, Subjectname);
                      let anyPayments = await Payments.countDocuments({
                        customerId: data._id,
                        status: "SUCCESS",
                      });
                      let previousValue = data.numberOfClassesBought;
                      let nextValue =
                        (demo && newStudents.includes(stud_id.toString())) ||
                        (demo && !oldSchedule.demo)
                          ? data.numberOfClassesBought + 1
                          : data.numberOfClassesBought;
                      if (previousValue !== nextValue) {
                        let newUpdate = new ClassHistoryModel({
                          previousValue,
                          nextValue,
                          comment: "Scheduled a Demo class",
                          customerId: stud_id,
                        });
                        await newUpdate.save();
                      }
                      await Customer.updateOne(
                        { _id: stud_id },
                        {
                          $set: {
                            scheduleDescription: schdDescription,
                            meetingLink: req.body.meetingLink,
                            teacherId: selectedTeacher.id,
                            numberOfClassesBought:
                              (demo &&
                                newStudents.includes(stud_id.toString())) ||
                              (demo && !oldSchedule.demo)
                                ? data.numberOfClassesBought + 1
                                : data.numberOfClassesBought,
                            classStatusId: demo
                              ? "38493085684944"
                              : anyPayments
                              ? "113975223750050"
                              : "121975682530440",
                          },
                        }
                      );
                    })
                    .catch((err) => {
                      console.log(err);
                    });
                })
                .catch((error) => {
                  console.log(error);
                });
            }
            Teacher.findOne({ id: teacher })
              .then((data) => {
                if (data) {
                  let { availableSlots } = data;
                  if (availableSlots) {
                    Object.keys(slots).forEach((day) => {
                      let arr = slots[day];
                      arr.forEach((slot) => {
                        let index = availableSlots.indexOf(slot);
                        if (index != -1) {
                          data.availableSlots.splice(index, 1);
                        }
                        data.scheduledSlots.push(slot);
                      });
                    });
                  }
                  data.availableSlots = [...new Set(data.availableSlots)];
                  data.scheduledSlots = [...new Set(data.scheduledSlots)];
                  data.save((err, docs) => {
                    if (err) {
                      console.log(err);
                      return res.status(500).json({
                        error: "error in updating teacher slots",
                      });
                    } else {
                      return res.json({
                        message: "schedule updated successfully",
                      });
                    }
                  });
                }
              })
              .catch((err) => {
                console.log(err);
                return res.status(400).json({
                  error: "error in updating students Links and Description",
                });
              });
          }
        );
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: "Zoom not available",
      });
    }
  };