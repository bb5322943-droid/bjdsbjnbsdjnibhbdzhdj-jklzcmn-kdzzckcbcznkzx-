import { login } from "../server/routes/auth";
import { db } from "../server/data/db";
import { users } from "../server/data/store";

db();

console.log("Users:", users.map(u => ({ login: u.login, id: u.id })));

const correctUser = users[0];
if (!correctUser) {
  console.log("No users found!");
  process.exit(1);
}

const req = {
  body: {
    login: correctUser.login,
    password: "123" // Just guess or we can force the hash?
  },
  headers: {},
  socket: { remoteAddress: "127.0.0.1" }
};

// Force the password hash so we know it will pass
import { hashPassword } from "../server/lib/auth";
correctUser.passwordHash = hashPassword("123");

const res = {
  status: function(code) {
    console.log("STATUS:", code);
    return this;
  },
  json: function(data) {
    console.log("JSON:", data);
    return this;
  }
};

try {
  console.log("Calling login for", correctUser.login);
  login(req, res);
} catch (e) {
  console.error("CAUGHT ERROR:", e);
}
