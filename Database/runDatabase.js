const { userTables } = require("./database_Modules/BlogPwaDB");

exports.runDatabase = async () => {
  try {
    await userTables();
  } catch (error) {
    console.log(error);
  }
};
