const mongoose = require('mongoose');

var TeacherDetailsSchema = new mongoose.Schema({
    teacherId: {
        type: String,

    },
    TeacherSubjects: [
        {
            subjectName: String
        }
    ],
    TeacherName: {
        type: String,
    },
    WorkingSlots: [
        {
            timmings: String
        }
    ],
    WorkingDates: [
        {
            day: String
        }
    ],
    Monday: [

        {
            timmingsSlot: String,
            className: String,
            studentsLimit: String,
            EnrolledStudents: [
                {
                    studentId: String,
                    studentName: String
                }
            ],
            meetingLink: String
        },
    ],
    Tuesday: [

        {
            timmingsSlot: String,
            className: String,
            studentsLimit: String,
            EnrolledStudents: [
                {
                    studentId: String,
                    studentName: String
                }
            ],
            meetingLink: String
        },
    ],
    WednesDay: [

        {
            timmingsSlot: String,
            className: String,
            studentsLimit: String,
            EnrolledStudents: [
                {
                    studentId: String,
                    studentName: String
                }
            ],
            meetingLink: String
        },
    ],
    Thrusday: [

        {
            timmingsSlot: String,
            className: String,
            studentsLimit: String,
            EnrolledStudents: [
                {
                    studentId: String,
                    studentName: String
                }
            ],
            meetingLink: String
        },
    ],
    Friday: [

        {
            timmingsSlot: String,
            className: String,
            studentsLimit: String,
            EnrolledStudents: [
                {
                    studentId: String,
                    studentName: String
                }
            ],
            meetingLink: String
        },
    ],
    Saturday: [

        {
            timmingsSlot: String,
            className: String,
            studentsLimit: String,
            EnrolledStudents: [
                {
                    studentId: String,
                    studentName: String
                }
            ],
            meetingLink: String
        },
    ],
    sunday: [

        {
            timmingsSlot: String,
            className: String,
            studentsLimit: String,
            EnrolledStudents: [
                {
                    studentId: String,
                    studentName: String
                }
            ],
            meetingLink: String
        },
    ],




});

module.exports = mongoose.model('TeacherDetail', TeacherDetailsSchema);
