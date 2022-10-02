import moment from "moment";

export const UserSchema = [
  { key: "name", default: "Default Value" },
  { key: "username", unique: true },
  { key: "created_date_unix", default: moment().unix() },
];
