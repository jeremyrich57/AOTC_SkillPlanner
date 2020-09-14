const express = require("express");
const skill_data = require("./public/JavaScript/Skill_Data");
const app = express();
const { readFile } = require("fs").promises;

app.use(express.static("public"));

app.listen(process.env.PORT || 3000, () =>
  console.log(`App avaiable on http://localhost:3000`)
);

app.get("/", async (request, response) => {
  response.send(await readFile("./home.html", "utf8"));
  6;
});

app.get("/api/getSkillData", async (req, res) => {
  res.json({
    SKILL_DATA: skill_data,
  });
});
