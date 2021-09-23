const Customers = require("../models/Customer.model");

exports.getCustomers = async (req, res) => {
  try {
    let { select, page, size, search, sortBy, isAsc, searchFrom } = req.query;
    if (select) select = select.split(",").join(" ");
    let sort = { _id: -1 };
    if (sortBy) {
      sort = {
        [sortBy]: isAsc == 1 ? 1 : -1,
      };
    }
    let skip = 0;
    let limit = 0;
    if (size) {
      limit = parseInt(size);
      skip = page * limit;
    } else {
      limit = 20;
      skip = page * limit;
    }
    let filter = {};
    let searchables =
      typeof searchFrom === "string" ? searchFrom.split(",") : [];
    if (search && searchFrom) {
      filter = {
        $or: searchables.map((searchable) => ({
          [searchable]: { $regex: "^"+ search, $options: "i" },
        })),
      };
    }

    const customers = await Customers.find(filter)
      .populate("subject")
      .populate("subjects")
      .populate("class")
      .populate("category")
      .populate("timeZone")
      .populate("classStatus")
      .populate("currency")
      .populate("agent")
      .populate("teacher")
      .select(select)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .lean()

    return res.json({
      message: "Customers Retrieved successfully!",
      result: customers,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ error: "Something went wrong!", result: err });
  }
};

exports.getCustomerById = (req, res) => {};
