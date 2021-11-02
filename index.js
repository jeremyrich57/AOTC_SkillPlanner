const express = require("express");
// const skill_data = require("./public/JavaScript/Skill_Data");
const app = express();
const { readFile } = require("fs").promises;
const fs = require("fs");
// const csv = require("csv-parser");
const { SlowBuffer } = require("buffer");
// const skillCSV = require("./public/csv/skills.csv");
const csv = require("csvtojson");
// const AdmZip = require("adm-zip"); //TODO: remove
const table = require("table").table;

app.use(express.static("public"));

app.listen(process.env.PORT || 3000, () =>
  console.log(`App avaiable on http://localhost:3000`)
);

app.get("/", async (request, response) => {
  response.send(await readFile("./home.html", "utf8"));
});

fs.readFile("./public/tre/skills.iff", "utf-8", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  // console.log(data);
  // let output = table(data);
  // console.log(output);
  // let buffer = Buffer.from(data, "base64");
  // let text = buffer.toString("utf-8");
  // console.log(text);
});

fs.readFile("./public/tre/aotc_03.tre", "utf-8", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  // console.log(data);
  // let buffer = Buffer.from(data, "base64");
  // let text = buffer.toString("utf-8");
  // console.log(text);
});

app.get("/api/getSkillData", async (req, res) => {
  const skill_data = {};
  const skillPlannerData = {};
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
  skillPlannerData.rawData = skill_data;
  skillPlannerData.skillData = convertCSVsToObjects(skill_data);
  skillPlannerData.professionLists = buildProfessionLists(
    skillPlannerData.skillData
  );

  res.json({
    skillPlannerData: skillPlannerData,
  });
});

//Skills CSV is in a different format than the other tables which are just
//name/value columns. While iterating over skills data may as well convert properties
//to lowercase to make it easier to read down the line.
function convertCSVsToObjects(skill_data) {
  let skillData = {};
  for (const csvData in skill_data) {
    if (csvData != "skills") {
      skillData[csvData] = {};
      skill_data[csvData].forEach(function (tableRow) {
        skillData[csvData][tableRow.name] = tableRow.value;
      });
    } else {
      skillData[csvData] = {};
      let professionName = "";
      let category = "";
      skill_data[csvData].forEach(function (tableRow) {
        let currentSkill = Object.fromEntries(
          Object.entries(tableRow).map(([key, value]) => [
            key.toLowerCase(),
            value.match(/^-?\d+$/) ? value * 1 : value,
          ])
        );

        if (currentSkill.is_hidden == "false") {
          if (currentSkill.is_profession == "true") {
            professionName = currentSkill.name;
            currentSkill.professionName = professionName;
          } else {
            currentSkill.professionName = professionName;
          }

          currentSkill.skills_required = currentSkill.skills_required
            .split(",")
            .filter((x) => x);

          currentSkill.commands = currentSkill.commands
            .split(",")
            .filter((x) => x);

          currentSkill.preclusion_skills = currentSkill.preclusion_skills
            .split(",")
            .filter((x) => x);

          let skillMods = {};
          currentSkill.skill_mods
            .split(",")
            .filter((x) => x)
            .forEach(function (skillMod) {
              let modName = skillMod.split("=")[0];
              let modValue = skillMod.split("=")[1];

              if (modName != "" && modValue != null) {
                skillMods[modName] = modValue * 1;
              }
            });

          currentSkill.skill_mods = skillMods;

          skillData[csvData][currentSkill.name] = currentSkill;
        }
      });
    }
  }

  return skillData;
}

/*****************************
 * Loop through skills to create profession list with novice, master, and
 * trees built out. Makes it easier for front end to just look up skill name.
 *****************************/
function buildProfessionLists(skillData) {
  let professionLists = {};
  let noviceProfessionList = [];
  let eliteProfessionList = [];
  let jediProfessionList = [];
  let forceSensitiveProfessionList = [];
  let pilotProfessionList = [];
  let currentProfession = {};
  let currentProfessionName = "";
  let previousSkillName = "";
  let skillTree = [];
  let eliteProfessionMap = {}; //Keep track of what elite professions to show on clicking a basic one
  let novicePrereqProfessionMap = {};
  let treeIndex = 1;

  for (const skillName in skillData.skills) {
    let skill = skillData.skills[skillName];

    if (skill.is_profession == "true") {
      currentProfession = {};
      currentProfession.novice = "";
      currentProfession.master = "";
      currentProfession.skillTrees = [];
      currentProfession.professionName = skill.professionName;
      currentProfession.parent = skill.parent;
      currentProfession.name = skillData.skill_names[skill.professionName];
      currentProfessionName = skill.professionName;
    } else if (skill.professionName == currentProfession.professionName) {
      if (skill.name.includes("novice")) {
        currentProfession.novice = skill.name;

        //Parent for is_profession is type/category
        //Difference between elite/basic profession is whether it has pre reqs
        //Create elite and pre req profession map to make easier to add links on planner
        switch (currentProfession.parent) {
          case "prequel":
            jediProfessionList.push(currentProfession);
            break;
          case "force_sensitive":
            forceSensitiveProfessionList.push(currentProfession);
            break;
          case "pilot":
            pilotProfessionList.push(profession);
            break;
          case "combat":
            if (
              skillData.skills[currentProfession.novice].skills_required
                .length > 0
            ) {
              eliteProfessionList.push(currentProfession);

              //Add elite profession link map
              skillData.skills[
                currentProfession.novice
              ].skills_required.forEach(function (prereqProfession) {
                if (eliteProfessionMap[prereqProfession] == undefined) {
                  eliteProfessionMap[prereqProfession] = [
                    currentProfession.professionName,
                  ];
                } else {
                  eliteProfessionMap[prereqProfession].push(
                    currentProfession.professionName
                  );
                }

                //Add pre req profession map
                let basicProfession =
                  skillData.skills[prereqProfession].professionName;
                if (
                  novicePrereqProfessionMap[currentProfession.professionName] ==
                  undefined
                ) {
                  novicePrereqProfessionMap[currentProfession.professionName] =
                    [basicProfession];
                } else if (
                  !novicePrereqProfessionMap[
                    currentProfession.professionName
                  ].includes(basicProfession)
                ) {
                  novicePrereqProfessionMap[
                    currentProfession.professionName
                  ].push(basicProfession);
                }
              });
            } else {
              noviceProfessionList.push(currentProfession);
            }
            break;
          case "crafting":
            if (
              skillData.skills[currentProfession.novice].skills_required
                .length > 0
            ) {
              eliteProfessionList.push(currentProfession);

              //Add elite profession link map
              skillData.skills[
                currentProfession.novice
              ].skills_required.forEach(function (prereqProfession) {
                if (eliteProfessionMap[prereqProfession] == undefined) {
                  eliteProfessionMap[prereqProfession] = [
                    currentProfession.professionName,
                  ];
                } else {
                  eliteProfessionMap[prereqProfession].push(
                    currentProfession.professionName
                  );
                }

                //Add pre req profession map
                let basicProfession =
                  skillData.skills[prereqProfession].professionName;
                if (
                  novicePrereqProfessionMap[currentProfession.professionName] ==
                  undefined
                ) {
                  novicePrereqProfessionMap[currentProfession.professionName] =
                    [basicProfession];
                } else if (
                  !novicePrereqProfessionMap[
                    currentProfession.professionName
                  ].includes(basicProfession)
                ) {
                  novicePrereqProfessionMap[
                    currentProfession.professionName
                  ].push(basicProfession);
                }
              });
            } else {
              noviceProfessionList.push(currentProfession);
            }
            break;
          case "shipwright":
            if (
              skillData.skills[currentProfession.novice].skills_required
                .length > 0
            ) {
              eliteProfessionList.push(currentProfession);

              //Add elite profession link map
              skillData.skills[
                currentProfession.novice
              ].skills_required.forEach(function (prereqProfession) {
                if (eliteProfessionMap[prereqProfession] == undefined) {
                  eliteProfessionMap[prereqProfession] = [
                    currentProfession.professionName,
                  ];
                } else {
                  eliteProfessionMap[prereqProfession].push(
                    currentProfession.professionName
                  );
                }

                //Add pre req profession map
                let basicProfession =
                  skillData.skills[prereqProfession].professionName;
                if (
                  novicePrereqProfessionMap[currentProfession.professionName] ==
                  undefined
                ) {
                  novicePrereqProfessionMap[currentProfession.professionName] =
                    [basicProfession];
                } else if (
                  !novicePrereqProfessionMap[
                    currentProfession.professionName
                  ].includes(basicProfession)
                ) {
                  novicePrereqProfessionMap[
                    currentProfession.professionName
                  ].push(basicProfession);
                }
              });
            } else {
              noviceProfessionList.push(currentProfession);
            }
            break;
          case "outdoors":
            if (
              skillData.skills[currentProfession.novice].skills_required
                .length > 0
            ) {
              eliteProfessionList.push(currentProfession);

              //Add elite profession link map
              skillData.skills[
                currentProfession.novice
              ].skills_required.forEach(function (prereqProfession) {
                if (eliteProfessionMap[prereqProfession] == undefined) {
                  eliteProfessionMap[prereqProfession] = [
                    currentProfession.professionName,
                  ];
                } else {
                  eliteProfessionMap[prereqProfession].push(
                    currentProfession.professionName
                  );
                }

                //Add pre req profession map
                let basicProfession =
                  skillData.skills[prereqProfession].professionName;
                if (
                  novicePrereqProfessionMap[currentProfession.professionName] ==
                  undefined
                ) {
                  novicePrereqProfessionMap[currentProfession.professionName] =
                    [basicProfession];
                } else if (
                  !novicePrereqProfessionMap[
                    currentProfession.professionName
                  ].includes(basicProfession)
                ) {
                  novicePrereqProfessionMap[
                    currentProfession.professionName
                  ].push(basicProfession);
                }
              });
            } else {
              noviceProfessionList.push(currentProfession);
            }
            break;
          case "science":
            if (
              skillData.skills[currentProfession.novice].skills_required
                .length > 0
            ) {
              eliteProfessionList.push(currentProfession);

              //Add elite profession link map
              skillData.skills[
                currentProfession.novice
              ].skills_required.forEach(function (prereqProfession) {
                if (eliteProfessionMap[prereqProfession] == undefined) {
                  eliteProfessionMap[prereqProfession] = [
                    currentProfession.professionName,
                  ];
                } else {
                  eliteProfessionMap[prereqProfession].push(
                    currentProfession.professionName
                  );
                }

                //Add pre req profession map
                let basicProfession =
                  skillData.skills[prereqProfession].professionName;
                if (
                  novicePrereqProfessionMap[currentProfession.professionName] ==
                  undefined
                ) {
                  novicePrereqProfessionMap[currentProfession.professionName] =
                    [basicProfession];
                } else if (
                  !novicePrereqProfessionMap[
                    currentProfession.professionName
                  ].includes(basicProfession)
                ) {
                  novicePrereqProfessionMap[
                    currentProfession.professionName
                  ].push(basicProfession);
                }
              });
            } else {
              noviceProfessionList.push(currentProfession);
            }
            break;
          case "social":
            if (
              skillData.skills[currentProfession.novice].skills_required
                .length > 0
            ) {
              eliteProfessionList.push(currentProfession);

              //Add elite profession link map
              skillData.skills[
                currentProfession.novice
              ].skills_required.forEach(function (prereqProfession) {
                if (eliteProfessionMap[prereqProfession] == undefined) {
                  eliteProfessionMap[prereqProfession] = [
                    currentProfession.professionName,
                  ];
                } else {
                  eliteProfessionMap[prereqProfession].push(
                    currentProfession.professionName
                  );
                }

                //Add pre req profession map
                let basicProfession =
                  skillData.skills[prereqProfession].professionName;
                if (
                  novicePrereqProfessionMap[currentProfession.professionName] ==
                  undefined
                ) {
                  novicePrereqProfessionMap[currentProfession.professionName] =
                    [basicProfession];
                } else if (
                  !novicePrereqProfessionMap[
                    currentProfession.professionName
                  ].includes(basicProfession)
                ) {
                  novicePrereqProfessionMap[
                    currentProfession.professionName
                  ].push(basicProfession);
                }
              });
            } else {
              noviceProfessionList.push(currentProfession);
            }
            break;
        }
      } else if (
        skill.name.split("_")[skill.name.split("_").length - 1] == "master"
      ) {
        currentProfession.master = skill.name;
      } else {
        if (skill.parent == currentProfession.professionName) {
          skillTree = [skill.name];
        } else if (skill.parent == previousSkillName) {
          skill.treeIndex = treeIndex;
          skillTree.push(skill.name);
          if (skill.name.includes("04")) {
            if (skillTree.length > 4) {
              skillTree = skillTree.slice(0, 3);
            }
            currentProfession.skillTrees.push(skillTree);
          }
        }
      }
    }

    previousSkillName = skill.name;
  }

  noviceProfessionList.sort(sortSkillsByName);
  eliteProfessionList.sort(sortSkillsByName);
  jediProfessionList.sort(sortSkillsByName);
  forceSensitiveProfessionList.sort(sortSkillsByName);
  pilotProfessionList.sort(sortSkillsByName);

  professionLists.basicList = noviceProfessionList;
  professionLists.eliteList = eliteProfessionList;
  professionLists.jediList = jediProfessionList;
  professionLists.forceList = forceSensitiveProfessionList;
  professionLists.pilotList = pilotProfessionList;
  professionLists.eliteProfessionMap = eliteProfessionMap;
  professionLists.novicePrereqProfessionMap = novicePrereqProfessionMap;

  function sortSkillsByName(a, b) {
    if (a.professionName == "prequel_basic") {
      return -1;
    } else if (b.professionName == "prequel_basic") {
      return 1;
    } else {
      return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
    }
  }

  return professionLists;
}
