import { Server } from "socket.io";
import { User } from "./models/user.models.js";
import { Status } from "./models/user.status.models.js";
import { Message } from "./models/message.models.js";
import jwt from "jsonwebtoken";
import * as parseCookie from "cookie";
import mongoose from "mongoose";

const setUpSocketIo = (server) => {
  const io = new Server(server, {
    cookie: true,
    cors: {
      origin: process.env.frontendUri,
      methods: ["GET", "POST"],
      credentials: true, // allow cookies and authorization headers to be sent
    },
  });

  io.on("connection", async (client) => {
    console.log("user connected", client.id);

    const cookie = client.handshake.headers.cookie;

    if (!cookie) {
      return;
    }

    const parsedCookie = parseCookie?.parse(cookie);

    const decodedCookie = jwt.verify(
      parsedCookie.accessToken,
      process.env.accessTokenSecret
    );

    const senderId = decodedCookie.id;

    const UpdateCurrentSocketId = await Status.findOneAndUpdate(
      {
        userId: senderId,
      },
      { currentSocketId: client.id },
      { new: true }
    );
    console.log("updated socket id", UpdateCurrentSocketId);

    client.emit("myId", {
      senderId,
    });

    const status = await Status.findOne({ userId: senderId });

    if (status) {
      console.log("updated client status");
      status.isOnline = true;
      await status.save();
    } else {
      const createStatus = await Status.create({
        userId: senderId,
        isOnline: true,
      });
    }

    // send message
    client.on("message", async (msg) => {
      const roomId = [msg.to, senderId].sort().join("_");

      const message = await Message.create({
        sender: senderId,
        receiver: msg.to,
        message: msg.message,
      });

      console.log("message saved to db");

      io.to(roomId).emit("message", {
        message: msg.message,
        to: msg.to,
        from: senderId,
        time: message.createdAt,
      });
      console.log(`message sent to ${roomId}`);
    });

    // join room
    client.on("joinroom", async (msg) => {
      const rooms = Array.from(client.rooms);
      if (rooms[1] !== "") {
        client.leave(rooms[1]);
      }

      const roomId = [msg.to, senderId].sort().join("_");

      //cheak if person is in contact
      const cheakContactExists = await User.findById(senderId);
      let updatedSender;

      if (cheakContactExists?.contact?.length === 0) {
        const updateReciver = await User.findByIdAndUpdate(
          { _id: msg.to },
          {
            $push: {
              contact: {
                contactId: senderId,
              },
            },
          }
        );
        updatedSender = await User.findByIdAndUpdate(
          { _id: senderId },
          {
            $push: {
              contact: {
                contactId: msg.to,
              },
            },
          }
        );
        console.log(`added to contacts`);

        console.log(updatedSender.contact);
      } else {
        const toObjectId = new mongoose.Types.ObjectId(msg.to);
        if (
          await User.findOne({
            _id: senderId,
            contact: {
              $elemMatch: { contactId: toObjectId },
            },
          })
        ) {
          console.log("user exists");
        } else {
          const updateReciver = await User.findByIdAndUpdate(
            { _id: msg.to },
            {
              $push: {
                contact: {
                  contactId: senderId,
                },
              },
            }
          );
          updatedSender = await User.findByIdAndUpdate(
            { _id: senderId },
            {
              $push: {
                contact: {
                  contactId: msg.to,
                },
              },
            }
          );
        }
      }

      client.join(roomId);
      client.emit("joinedRoomAck", {
        roomId,
      });
      console.log("client connected to ", roomId);
    });

    client.on("notTyping", async (msg) => {
      const findStatus = await Status.findOneAndUpdate(
        {
          userId: senderId,
        },
        { isWriting: false }
      );

      console.log(findStatus);
    });

    client.on("isTyping", async (msg) => {
      const findStatus = await Status.findOneAndUpdate(
        {
          userId: senderId,
        },
        { isWriting: true }
      );
    });

    client.on("iceCandidate", (msg) => {
      client.to(msg.ReciverCurrentSocketId).emit("iceCandidate", {
        candidate: msg.candidate,
        SenderCurrentSocketId: msg.SenderCurrentSocketId,
      });
    });

    client.on("offer", (msg) => {
      console.log("offer arrived on server");
      client.to(msg.ReciverCurrentSocketId).emit("offerArrived", {
        offer: msg.offer,
        SenderCurrentSocketId: msg.SenderCurrentSocketId,
        senderpfp: msg.senderpfp,
        senderName: msg.senderName,
      });
    });

    client.on("answerOffer", (msg) => {
      console.log(
        "sending ansdwcccwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww",
        msg.SenderCurrentSocketId
      );
      client.to(msg.incomingOfferSender).emit("offerAccepted", {
        answer: msg.answer,
        SenderCurrentSocketId: msg.SenderCurrentSocketId,
      });
    });

    client.on("DeclineCall", (msg) => {
      client.to(msg.incomingOfferSender).emit("callDeclined");
    });

    client.on("disconnect", async () => {
      console.log("user disconnected", client.id);

      const RemoveCurrentSocketId = await Status.findOneAndUpdate(
        {
          userId: senderId,
        },
        { currentSocketId: null },
        { new: true }
      );

      const clientStatus = await Status.findOneAndUpdate(
        {
          userId: senderId,
        },
        { lastSeen: Date.now(), isOnline: false },
        {
          new: true,
        }
      );

      const findStatus = await Status.findOneAndUpdate(
        {
          userId: senderId,
        },
        { isWriting: false }
      );

      console.log(findStatus);
    });
  });
};

export { setUpSocketIo };
