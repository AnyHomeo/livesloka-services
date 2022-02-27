const mongoose = require("mongoose");
const mongooseLeanVirtuals = require("mongoose-lean-virtuals");

const SlotOptionsSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    options: [
      {
        monday: { type: String },
        tuesday: { type: String },
        wednesday: { type: String },
        thursday: { type: String },
        friday: { type: String },
        saturday: { type: String },
        sunday: { type: String },
      },
    ],
    schedules: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Schedule",
      }, 
    ],
    selectedSlotId: { type: String },
    selectedSlotType: { type: String, enum: ["NEW", "EXISTING"] },
    teacher: {
      type: String,
    },
    discounts:[{
      plan: {
       type: mongoose.Schema.Types.ObjectId,
       ref:"Plan"
      },
      amount: Number
    }],
    startDate:{ type: Date },
    isScheduled:{
      type: Boolean,
      default: false
    },
    selectedPlan:{
      type: mongoose.Schema.Types.ObjectId,
      ref:"Plan"
    }
  }, 
  { timestamps: true }
);

SlotOptionsSchema.virtual("teacherData", {
  ref: "Teacher",
  localField: "teacher",
  foreignField: "id",
  justOne: true,
});

SlotOptionsSchema.plugin(mongooseLeanVirtuals);

module.exports = mongoose.model("SlotOptions", SlotOptionsSchema);
