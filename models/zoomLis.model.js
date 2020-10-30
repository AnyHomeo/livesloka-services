const mongoose = require('mongoose');

var zoomLisSchema = new mongoose.Schema({
    NumberOfZoomLiscences: String,
    zoomLicenses: [
        {
            zoomVer: String,
            ZoomApiKey: String,
            ZoomSecret: String,
            MeetingsList: [   // destructure here with meetingList  : [{meetingId}]
                {
                    day: String,
                    Timmings: String,
                    MeetingName: String,
                    hostName: String
                },
            ]
        },

    ]

});

module.exports = mongoose.model('zoomLi', zoomLisSchema);
