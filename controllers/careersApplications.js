const CareersApplications = require("../models/CareersApplications")

exports.registerInCareers = async (req,res) =>{
    try {
        let newCareersApplication = new CareersApplications({...req.body})
        await newCareersApplication.save()
        return res.json({
            message:"Applied Successfully!"
        })
    } catch (error) {
        console.log(error)
        return res.json({
            error:"Something went wrong"
        })
    }
}