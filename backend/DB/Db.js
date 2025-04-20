import mongoose from "mongoose";

const Db = async () => {
  try {
    const mongodbInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${process.env.DB_NAME}`
    );

    console.log(
      `connected to mongo db || host : ${mongodbInstance.connection.host}`
    );
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

export { Db };
