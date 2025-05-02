import { asyncHandler } from "../utils/async.handler.js";
import { io } from "../app.js";

const sendMessage = asyncHandler(async (req, res) => {
  const { person1, person2 } = req.body;

  const roomId = [person1, person2].sort().join("_");
});

export { sendMessage };
