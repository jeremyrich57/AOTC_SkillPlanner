const express = require("express");
// const skill_data = require("./public/JavaScript/Skill_Data");
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
  const skill_data = {};

  const skills = await csv().fromFile("./public/csv/skills.csv");
  const skill_names = await csv().fromFile("./public/csv/skill_names.csv");
  const skill_descriptions = await csv().fromFile(
    "./public/csv/skill_descriptions.csv"
  );
  const skill_mod_names = await csv().fromFile(
    "./public/csv/skill_mod_names.csv"
  );
  const skill_mod_descriptions = await csv().fromFile(
    "./public/csv/skill_mod_descriptions.csv"
  );
  const command_descriptions = await csv().fromFile(
    "./public/csv/command_descriptions.csv"
  );
  const command_names = await csv().fromFile("./public/csv/command_names.csv");
  const xp_names = await csv().fromFile("./public/csv/xp_names.csv");
  const xp_descriptions = await csv().fromFile(
    "./public/csv/xp_descriptions.csv"
  );
  const skill_titles = await csv().fromFile("./public/csv/skill_titles.csv");

  skill_data.skills = skills;
  skill_data.skill_names = skill_names;
  skill_data.skill_descriptions = skill_descriptions;
  skill_data.skill_mod_names = skill_mod_names;
  skill_data.skill_mod_descriptions = skill_mod_descriptions;
  skill_data.command_descriptions = command_descriptions;
  skill_data.command_names = command_names;
  skill_data.exp_names = xp_names;
  skill_data.exp_descriptions = xp_descriptions;
  skill_data.skill_titles = skill_titles;

  res.json({
    SKILL_DATA: skill_data,
  });
});
