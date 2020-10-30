const mongoose = require('mongoose');

var TeacherSchema = new mongoose.Schema({
    id: {
        type: String,

    },
    TeacherDesc: {
        type: String,
    },
    TeacherName: {
        type: String,
    },

    TeacherStatus: {
        type: String,
    },
    TeacherDetailsId: { type: mongoose.Schema.Types.ObjectId, ref: "teacherDet" },
    TeacherSubjectsId: {
        type: Array,
    },

});

module.exports = mongoose.model('Teacher', TeacherSchema);
