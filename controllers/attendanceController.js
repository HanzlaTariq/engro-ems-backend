// import Attendance from "../models/Attendance.js";

// Helper: convert "HH:MM" to minutes
const toMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

// // Helper: minutes to string format (e.g., "30m" or "1h 30m")
const minutesToString = (minutes) => {
  if (minutes <= 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

// // Create new attendance
// export const createAttendance = async (req, res) => {
//   try {
//     const { date, timeIn, timeOut, directDiversion, totalHandling } = req.body;

//     // Required fields check
//     if (!date || !timeIn || !timeOut) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     if (timeOut <= timeIn) {
//       return res.status(400).json({ message: "Time Out must be later than Time In" });
//     }

//     const inMinutes = toMinutes(timeIn);
//     const outMinutes = toMinutes(timeOut);
//     const routineEnd = toMinutes("17:30");
//     const extraMinutes = outMinutes > routineEnd ? outMinutes - routineEnd : 0;

//     // ✅ Auto-set whiSignature from logged-in user (secure, form override ignore)
//     const whiSignature = req.user.email;  // Auth middleware se aayega

//     const attendance = new Attendance({
//       date,
//       timeIn,
//       timeOut,
//       extraTime: minutesToString(extraMinutes),  // String format
//       directDiversion: directDiversion || 0,
//       totalHandling: totalHandling || 0,
//       whiSignature,
//     });

//     await attendance.save();
//     res.status(201).json({ message: "Attendance saved successfully", attendance });
//   } catch (error) {
//     console.error("Error saving attendance:", error);
//     res.status(400).json({ message: error.message });
//   }
// };

// // Get MY attendances (user-specific, already good but improved)
// export const getMyAttendances = async (req, res) => {
//   try {
//     const userEmail = req.user.email;  // Logged-in user
//     const { page = 1, limit = 1000 } = req.query;  // Frontend ke params support karo
//     const skip = (page - 1) * Number(limit);

//     const filter = { whiSignature: userEmail };
//     const total = await Attendance.countDocuments(filter);
//     const attendances = await Attendance.find(filter)
//       .sort({ date: -1 })
//       .skip(skip)
//       .limit(Number(limit));

//     res.status(200).json({ attendances, total, page: Number(page), pages: Math.ceil(total / limit) });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error fetching records", error: error.message });
//   }
// };

// // Get ALL attendances (admin-only, optional filter add kar sakte ho role se)
// export const getAttendances = async (req, res) => {
//   try {
//     // ✅ Optional: Sirf admin ko allow kar (req.user.role === 'Admin' check)
//     if (req.user.role !== 'Admin') {
//       return res.status(403).json({ message: "Access denied" });
//     }

//     const { page = 1, limit = 10 } = req.query;
//     const skip = (page - 1) * Number(limit);

//     const attendances = await Attendance.find()
//       .sort({ date: -1 })
//       .skip(skip)
//       .limit(Number(limit));

//     const total = await Attendance.countDocuments();

//     res.status(200).json({
//       attendances,
//       total,
//       page: Number(page),
//       pages: Math.ceil(total / limit),
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error fetching records", error: error.message });
//   }
// };

// // Update attendance (ownership check add)
// export const updateAttendance = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { timeIn, timeOut, directDiversion, totalHandling } = req.body;

//     // Ownership check
//     const existing = await Attendance.findOne({ _id: id, whiSignature: req.user.email });
//     if (!existing) {
//       return res.status(403).json({ message: "Access denied: Not your record" });
//     }

//     let updateData = { 
//       directDiversion: directDiversion !== undefined ? directDiversion : existing.directDiversion,
//       totalHandling: totalHandling !== undefined ? totalHandling : existing.totalHandling,
//     };

//     // Recalculate extraTime if times updated
//     if (timeIn || timeOut) {
//       const currentTimeIn = timeIn || existing.timeIn;
//       const currentTimeOut = timeOut || existing.timeOut;
//       if (currentTimeOut <= currentTimeIn) {
//         return res.status(400).json({ message: "Time Out must be later than Time In" });
//       }
//       const outMinutes = toMinutes(currentTimeOut);
//       const routineEnd = toMinutes("17:30");
//       const extraMinutes = outMinutes > routineEnd ? outMinutes - routineEnd : 0;
//       updateData.extraTime = minutesToString(extraMinutes);
//       updateData.timeIn = currentTimeIn;
//       updateData.timeOut = currentTimeOut;
//     }

//     const updated = await Attendance.findByIdAndUpdate(id, updateData, {
//       new: true,
//       runValidators: true,
//     });

//     res.status(200).json({ message: "Attendance updated successfully", updated });
//   } catch (error) {
//     console.error(error);
//     res.status(400).json({ message: "Error updating record", error: error.message });
//   }
// };






import Attendance from "../models/Attendance.js";

// Helpers same (toMinutes, minutesToString – pehle wala code rakh lo)

// Create new attendance
export const createAttendance = async (req, res) => {
  try {
    console.log('🆕 Create - req.userId:', req.userId);  // Log

    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized – login again to get user ID" });
    }

    const { date, timeIn, timeOut, whiSignature, directDiversion, totalHandling } = req.body;

    if (!date || !timeIn || !timeOut || !whiSignature) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (timeOut <= timeIn) {
      return res.status(400).json({ message: "Time Out must be later than Time In" });
    }

    const inMinutes = toMinutes(timeIn);
    const outMinutes = toMinutes(timeOut);
    const routineEnd = toMinutes("17:30");
    const extraMinutes = outMinutes > routineEnd ? outMinutes - routineEnd : 0;

    const attendance = new Attendance({
      date,
      timeIn,
      timeOut,
      extraTime: minutesToString(extraMinutes),
      directDiversion: directDiversion || 0,
      totalHandling: totalHandling || 0,
      whiSignature,
      createdBy: req.userId,  // ✅ Ye set hoga ab
    });

    console.log('🆕 Saving with createdBy:', req.userId);  // Log

    await attendance.save();
    res.status(201).json({ message: "Attendance saved successfully", attendance });
  } catch (error) {
    console.error("Create error:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// Get MY attendances (user-specific)
export const getMyAttendances = async (req, res) => {
  try {
    const userId = req.userId;  // Middleware se
    console.log('📋 Fetching attendance for user ID:', userId);  // Temp log

    const { page = 1, limit = 1000 } = req.query;
    const skip = (page - 1) * Number(limit);

    const filter = { createdBy: userId };  // ✅ ID-based filter
    const total = await Attendance.countDocuments(filter);
    const attendances = await Attendance.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'email');  // Optional: Email populate for display

    res.status(200).json({ attendances, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching records", error: error.message });
  }
};

// Get ALL attendances (admin-only)
export const getAttendances = async (req, res) => {
  try {
    // Admin check (agar req.user.role available hai middleware se)
    if (req.user?.role !== 'Admin') {
      return res.status(403).json({ message: "Admin access only" });
    }

    // ... rest same (pagination + saara data)
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * Number(limit);

    const attendances = await Attendance.find()
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Attendance.countDocuments();

    res.status(200).json({
      attendances,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching records", error: error.message });
  }
};

// Update attendance
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Ownership check
    const existing = await Attendance.findOne({ _id: id, createdBy: userId });  // ✅ ID-based check
    if (!existing) {
      return res.status(403).json({ message: "Access denied: Not your record" });
    }

    // ... rest same (time validation, updateData, findByIdAndUpdate)
    let updateData = { ...req.body };

    // Recalculate extraTime if needed
    if (req.body.timeIn || req.body.timeOut) {
      const currentTimeIn = req.body.timeIn || existing.timeIn;
      const currentTimeOut = req.body.timeOut || existing.timeOut;
      if (currentTimeOut <= currentTimeIn) {
        return res.status(400).json({ message: "Time Out must be later than Time In" });
      }
      const outMinutes = toMinutes(currentTimeOut);
      const routineEnd = toMinutes("17:30");
      const extraMinutes = outMinutes > routineEnd ? outMinutes - routineEnd : 0;
      updateData.extraTime = minutesToString(extraMinutes);
    }

    const updated = await Attendance.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ message: "Attendance updated successfully", updated });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error updating record", error: error.message });
  }
};
