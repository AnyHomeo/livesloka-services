const Customers = require("../models/Customer.model");
const Admins = require("../models/Admin.model");

exports.getCustomers = async (req, res) => {
  try {
    let {
      select,
      page,
      size,
      search,
      sortBy,
      isAsc,
      searchFrom,
      values,
      field,
    } = req.query;
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
          [searchable]: { $regex: "^" + search, $options: "i" },
        })),
      };
    }
    if (field) {
      filter[field] = {
        $in: values.split(","),
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
      .lean();

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

exports.postNotificationToken = async(req, res) => {
  try {
    const { token } = req.body;
    const login = await Admins.findOne({ userId: req.params.userId });
    if (login) {
      if (login.notificationToken && login.notificationToken.length) {
        login.notificationToken.push(token);
      } else {
        login.notificationToken = [token];
      }
      await login.save();
      return res.json({ message: "Token added successfully" });
    } else {
      return res.status(400).json({ error: "Invalid userId!", result: null });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "Something went wrong!", result: null });
  }
};
