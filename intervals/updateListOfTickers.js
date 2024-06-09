const express = require("express");
const cron = require("node-cron");

const app = express();

// Define the function you want to execute
function scheduledTask() {
  console.log("Executing task...");
}

// Schedule the task to run at a specific time each day except weekends
// The cron syntax '30 0 9 * * 1-5' means "At 09:30 on every day-of-week from Monday through Friday"
cron.schedule("30 9 * * 1-5", () => {
  scheduledTask();
});
