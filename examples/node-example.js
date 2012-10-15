//
// Simple example of using sqlish with NodeJS
//
var sqlish = require("../sqlish"),
	Sql = new sqlish.Sqlish("MySQL 5.5"),
	message = {
		id: 0,
		name: "fred",
		email: "fred@gmail.com",
		messages: 'He Said, "Hello World"',
		sent: new Date("09/01/2012 14:15:00")
	};

// Output:
// INSERT INTO messages (name, email, msg, sent) VALUES (
//	"fred", "fred@example.com", "He siad, \"Hello World\"", 
//	"2012-09-01 14:15:00")
console.log(Sql.insert("test", message).toString());

// Output:
// SELECT id, name, email, msg, sent FROM messages 
//	WHERE email LIKE "%@example.com"
console.log(Sql.select(Object.keys(message))
		.from("messages")
		.where({email: {$like: "%@example.com"}}).toString());

// Output:
// REPLACE INTO messages (id, name, email, msg, sent) VALUES (
//	10123, "George", "george@example.com", "He siad, \"Hello World\"", 
//	"2012-07-01")
message.id = 10123;
message.name = "George";
message.email = "george@example.com";
message.sent = new Date("07/01/2012");
console.log(Sql.replace("test", message).toString());
