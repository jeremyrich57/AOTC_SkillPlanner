const express = require("express");
const skill_data = require("./public/JavaScript/Skill_Data");
const app = express();
const { readFile } = require("fs").promises;
const fs = require("fs");
// const csv = require("csv-parser");
const { SlowBuffer } = require("buffer");
// const skillCSV = require("./public/csv/skills.csv");
const csv = require("csvtojson");

app.use(express.static("public"));

app.listen(process.env.PORT || 3000, () =>
  console.log(`App avaiable on http://localhost:3000`)
);

app.get("/", async (request, response) => {
  response.send(await readFile("./home.html", "utf8"));
});

app.get("/api/getSkillData", async (req, res) => {
  const skills = await csv().fromFile("./public/csv/skills.csv");
  const skill_names = await csv().fromFile("./public/csv/skill_names.csv");

  skill_data.new_skills = skills;
  skill_data.new_skill_names = skill_names;

  res.json({
    SKILL_DATA: skill_data,
  });
});
