const { createServer } = require("http");
const { Server } = require("socket.io");
const Comment = require("../models/comment");

const socketModule = (server) => {
  const io = new Server(server, {
    cors: {
      credentials: true,
      origin: "*",
      // ["http://localhost:3000", "http://192.168.0.105:3000"],
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });
  io.on("connection", (socket) => {
    console.log(socket.id);
    console.log(io.sockets.sockets.size);
    socket.on("submit", async ({ id }) => {
      const { isComic } = socket.handshake.query;
      console.log(isComic);
      if (isComic === 'false') {
        const comments = await Comment.find({ chapter: id }).populate(
          "comic chapter user"
        ).sort("-createdAt");
        const count = comments.length;
        const data = Array.from(comments).map((item) => {
          return {
            user: item.user.fullname,
            avatar: item.user.avatar,
            comic: item.comic.title,
            chapter: item.chapter.chapNumber,
            content: item.content,
            createdAt: item.createdAt,
          };
        });
        io.sockets.emit("refreshCmt", {
          success: comments ? true : false,
          count: count,
          mes: comments ? data : "Something went wrong",
        });
      } else {
        const comments = await Comment.find({ comic: id })
          .populate("comic chapter user")
          .sort("-createdAt");
        const count = comments.length;
        const data = Array.from(comments).map((item) => {
          return {
            user: item.user.fullname,
            avatar: item.user.avatar,
            comic: item.comic.title,
            chapter: item.chapter?.chapNumber,
            content: item.content,
            createdAt: item.createdAt,
          };
        });
        io.sockets.emit("refreshCmt", {
          success: comments ? true : false,
          count: count,
          mes: comments ? data : "Something went wrong",
        });
      }
    });
    socket.on("disconnect", () => {
      console.log("ngắt kết nối: " + socket.id);
      console.log(io.sockets.sockets.size);
    });
  });
};

module.exports = socketModule