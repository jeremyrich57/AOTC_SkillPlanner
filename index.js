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
  skillPlannerData.skills = buildSkills(skillPlannerData.skillData);

  skillPlannerData.professionLists = buildProfessionLists(
    skillPlannerData.skillData
  );
  // skillPlannerData.eliteProfessionPrerequisites =
  //   buildEliteProfessions(skillPlannerData);

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
  let noviceProfessionMap = {};

  for (const skillName in skillData.skills) {
    let skill = skillData.skills[skillName];

    if (skill.is_profession == "true") {
      currentProfession = {};
      currentProfession.novice = "";
      currentProfession.master = "";
      currentProfession.skillTrees = [];
      currentProfession.professionName = skill.professionName;
      currentProfession.parent = skill.parent;
      currentProfessionName = skill.professionName;
    } else if (skill.professionName == currentProfession.professionName) {
      if (skill.name.includes("novice")) {
        currentProfession.novice = skill.name;

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
                  noviceProfessionMap[currentProfession.professionName] ==
                  undefined
                ) {
                  noviceProfessionMap[currentProfession.professionName] = [
                    basicProfession,
                  ];
                } else if (
                  !noviceProfessionMap[
                    currentProfession.professionName
                  ].includes(basicProfession)
                ) {
                  noviceProfessionMap[currentProfession.professionName].push(
                    basicProfession
                  );
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
                  noviceProfessionMap[currentProfession.professionName] ==
                  undefined
                ) {
                  noviceProfessionMap[currentProfession.professionName] = [
                    basicProfession,
                  ];
                } else if (
                  !noviceProfessionMap[
                    currentProfession.professionName
                  ].includes(basicProfession)
                ) {
                  noviceProfessionMap[currentProfession.professionName].push(
                    basicProfession
                  );
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
                  noviceProfessionMap[currentProfession.professionName] ==
                  undefined
                ) {
                  noviceProfessionMap[currentProfession.professionName] = [
                    basicProfession,
                  ];
                } else if (
                  !noviceProfessionMap[
                    currentProfession.professionName
                  ].includes(basicProfession)
                ) {
                  noviceProfessionMap[currentProfession.professionName].push(
                    basicProfession
                  );
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
                  noviceProfessionMap[currentProfession.professionName] ==
                  undefined
                ) {
                  noviceProfessionMap[currentProfession.professionName] = [
                    basicProfession,
                  ];
                } else if (
                  !noviceProfessionMap[
                    currentProfession.professionName
                  ].includes(basicProfession)
                ) {
                  noviceProfessionMap[currentProfession.professionName].push(
                    basicProfession
                  );
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
                  noviceProfessionMap[currentProfession.professionName] ==
                  undefined
                ) {
                  noviceProfessionMap[currentProfession.professionName] = [
                    basicProfession,
                  ];
                } else if (
                  !noviceProfessionMap[
                    currentProfession.professionName
                  ].includes(basicProfession)
                ) {
                  noviceProfessionMap[currentProfession.professionName].push(
                    basicProfession
                  );
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
                  noviceProfessionMap[currentProfession.professionName] ==
                  undefined
                ) {
                  noviceProfessionMap[currentProfession.professionName] = [
                    basicProfession,
                  ];
                } else if (
                  !noviceProfessionMap[
                    currentProfession.professionName
                  ].includes(basicProfession)
                ) {
                  noviceProfessionMap[currentProfession.professionName].push(
                    basicProfession
                  );
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
          skillTree.push(skill.name);
          if (skill.name.includes("04")) {
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
  professionLists.noviceProfessionMap = noviceProfessionMap;

  function sortSkillsByName(a, b) {
    if (a.professionName == "prequel_basic") {
      return -1;
    } else if (b.professionName == "prequel_basic") {
      return 1;
    } else {
      return skillData.skill_names[a.professionName] >
        skillData.skill_names[b.professionName]
        ? 1
        : skillData.skill_names[a.professionName] <
          skillData.skill_names[b.professionName]
        ? -1
        : 0;
    }
  }

  return professionLists;
}

function buildSkills(skillData) {
  let newSkills = {};
  let parentSkillName;
  let treeBaseIndex = 0; //Tree index for profession
  let skillIndex = 0; //Index for the skill inside the tree
  let professionName = "";
  let noviceName = "";
  let masterName = "";

  for (const skillName in skillData.skills) {
    let currentSkill = skillData.skills[skillName];

    newSkills[currentSkill.name] = currentSkill;
  }

  // skill_data.skills.forEach(function (skillRow) {
  //   //Make properties lower case because it's easier to read
  //   let newSkillRow = Object.fromEntries(
  //     Object.entries(skillRow).map(([k, v]) => [k.toLowerCase(), v])
  //   );

  //   let trees;
  //   switch (newSkillRow.graph_type) {
  //     case "fourByFour":
  //       trees = new Array(4);
  //       for (let i = 0; i < trees.length; i++) {
  //         trees[i] = new Array(4);
  //       }
  //       break;
  //     case "oneByFour":
  //       trees = new Array(1);
  //       trees[0] = new Array(4);
  //       break;
  //     case "pyramid":
  //       trees = new Array(1);
  //       trees[0] = new Array(4);
  //       break;
  //     default:
  //       trees = new Array(4);
  //       for (let i = 0; i < trees.length; i++) {
  //         trees[i] = new Array(4);
  //       }
  //       break;
  //   }

  //   if (newSkillRow.is_hidden == "false") {
  //     if (newSkillRow.is_profession == "true") {
  //       parentSkillName = newSkillRow.name;

  //       newSkills[parentSkillName] = newSkillRow;

  //       newSkills[parentSkillName].category = newSkills[parentSkillName].parent;
  //       newSkills[parentSkillName].trees = trees;
  //       treeBaseIndex = 0;
  //       skillIndex = 0;
  //     } else if (
  //       newSkillRow.name.indexOf("novice") > -1 &&
  //       newSkillRow.parent == parentSkillName
  //     ) {
  //       if (newSkills[newSkillRow.parent] == undefined) {
  //         newSkills[newSkillRow.parent] = {};
  //         newSkills[newSkillRow.parent].novice = newSkillRow;
  //         newSkills[newSkillRow.parent].novice.skills_required =
  //           newSkillRow.skills_required.split(",");
  //         newSkills[newSkillRow.parent].trees = trees;
  //       } else {
  //         newSkills[newSkillRow.parent].novice = newSkillRow;

  //         if (newSkillRow.skills_required != "") {
  //           let skillsRequired = newSkillRow.skills_required.split(",");
  //           newSkills[newSkillRow.parent].novice.skills_required =
  //             skillsRequired;
  //         } else {
  //           newSkills[newSkillRow.parent].novice.skills_required = [];
  //         }
  //       }

  //       //Update number fields so math works later
  //       newSkills[newSkillRow.parent].novice.points_required = parseInt(
  //         newSkillRow.points_required
  //       );
  //       newSkills[newSkillRow.parent].novice.xp_cap = parseInt(
  //         newSkillRow.xp_cap
  //       );
  //       newSkills[newSkillRow.parent].novice.xp_cost = parseInt(
  //         newSkillRow.xp_cost
  //       );
  //       newSkills[newSkillRow.parent].novice.money_required = parseInt(
  //         newSkillRow.money_required
  //       );

  //       newSkills[newSkillRow.parent].novice.skill_mods =
  //         newSkills[newSkillRow.parent].novice.skill_mods.split(",");

  //       newSkills[newSkillRow.parent].novice.skill_mods.forEach(function (mod) {
  //         let modName = mod.split("=")[0];
  //         let modValue = mod.split("=")[1];

  //         if (newSkills[newSkillRow.parent].novice.mods == undefined) {
  //           newSkills[newSkillRow.parent].novice.mods = {};
  //         }
  //         if (modName != "" && modName != undefined && !isNaN(modValue)) {
  //           newSkills[newSkillRow.parent].novice.mods[modName] =
  //             parseFloat(modValue);
  //         }
  //       });
  //     } else if (
  //       newSkillRow.name.indexOf("master") > -1 &&
  //       newSkillRow.parent == parentSkillName &&
  //       newSkillRow.skills_required.indexOf("novice") < 0
  //     ) {
  //       if (newSkills[newSkillRow.parent] == undefined) {
  //         newSkills[newSkillRow.parent] = {};
  //         newSkills[newSkillRow.parent].master = newSkillRow;
  //         newSkills[newSkillRow.parent].trees = trees;
  //         newSkills[newSkillRow.parent].master.skills_required =
  //           newSkillRow.skills_required.split(",");
  //       } else {
  //         newSkills[newSkillRow.parent].master = newSkillRow;
  //         newSkills[newSkillRow.parent].master.skills_required =
  //           newSkillRow.skills_required.split(",");
  //       }

  //       //Update number fields so math works later
  //       newSkills[newSkillRow.parent].master.points_required = parseInt(
  //         newSkillRow.points_required
  //       );
  //       newSkills[newSkillRow.parent].master.xp_cap = parseInt(
  //         newSkillRow.xp_cap
  //       );
  //       newSkills[newSkillRow.parent].master.xp_cost = parseInt(
  //         newSkillRow.xp_cost
  //       );
  //       newSkills[newSkillRow.parent].master.money_required = parseInt(
  //         newSkillRow.money_required
  //       );

  //       newSkills[newSkillRow.parent].master.skill_mods =
  //         newSkills[newSkillRow.parent].master.skill_mods.split(",");

  //       newSkills[newSkillRow.parent].master.skill_mods.forEach(function (mod) {
  //         let modName = mod.split("=")[0];
  //         let modValue = mod.split("=")[1];

  //         if (newSkills[newSkillRow.parent].master.mods == undefined) {
  //           newSkills[newSkillRow.parent].master.mods = {};
  //         }
  //         if (modName != "" && modName != undefined && !isNaN(modValue)) {
  //           newSkills[newSkillRow.parent].master.mods[modName] =
  //             parseFloat(modValue);
  //         }
  //       });
  //     } else {
  //       if (
  //         newSkillRow.parent != "" &&
  //         newSkillRow.name.indexOf("language") < 0 &&
  //         newSkillRow.name.indexOf("species") < 0 &&
  //         newSkillRow.name.indexOf("pilot") < 0 &&
  //         newSkillRow.name.indexOf("gcw_currency") < 0 &&
  //         newSkills[parentSkillName] != undefined &&
  //         newSkills[parentSkillName].trees != undefined
  //       ) {
  //         if (
  //           newSkills[parentSkillName].trees.length &&
  //           newSkills[parentSkillName].trees[treeBaseIndex].length
  //         ) {
  //           newSkills[parentSkillName].trees[treeBaseIndex][skillIndex] =
  //             newSkillRow;

  //           //Update number fields so math works later
  //           newSkills[parentSkillName].trees[treeBaseIndex][
  //             skillIndex
  //           ].points_required = parseInt(newSkillRow.points_required);
  //           newSkills[parentSkillName].trees[treeBaseIndex][skillIndex].xp_cap =
  //             parseInt(newSkillRow.xp_cap);
  //           newSkills[parentSkillName].trees[treeBaseIndex][
  //             skillIndex
  //           ].xp_cost = parseInt(newSkillRow.xp_cost);
  //           newSkills[parentSkillName].trees[treeBaseIndex][
  //             skillIndex
  //           ].money_required = parseInt(newSkillRow.money_required);

  //           newSkills[parentSkillName].trees[treeBaseIndex][
  //             skillIndex
  //           ].skill_mods =
  //             newSkills[parentSkillName].trees[treeBaseIndex][
  //               skillIndex
  //             ].skill_mods.split(",");

  //           newSkills[parentSkillName].trees[treeBaseIndex][
  //             skillIndex
  //           ].skill_mods.forEach(function (mod) {
  //             let modName = mod.split("=")[0];
  //             let modValue = mod.split("=")[1];

  //             if (
  //               newSkills[parentSkillName].trees[treeBaseIndex][skillIndex]
  //                 .mods == undefined
  //             ) {
  //               newSkills[parentSkillName].trees[treeBaseIndex][
  //                 skillIndex
  //               ].mods = {};
  //             }
  //             if (modName != "" && modName != undefined && !isNaN(modValue)) {
  //               newSkills[parentSkillName].trees[treeBaseIndex][
  //                 skillIndex
  //               ].mods[modName] = parseFloat(modValue);
  //             }
  //           });
  //         }

  //         switch (newSkillRow.graph_type) {
  //           case "fourByFour":
  //             if (newSkillRow.name.slice(-2) == "04") {
  //               treeBaseIndex++;
  //               skillIndex = 0;
  //             } else {
  //               skillIndex++;
  //             }
  //             break;
  //           case "oneByFour":
  //             skillIndex++;
  //             break;
  //           case "pyramid":
  //             skillIndex++;
  //             break;
  //           default:
  //             if (newSkillRow.name.slice(-2) == "04") {
  //               treeBaseIndex++;
  //               skillIndex = 0;
  //             } else {
  //               skillIndex++;
  //             }
  //             break;
  //         }
  //       }
  //     }
  //   }
  // });

  return newSkills;
}

function buildEliteProfessions(skillData) {
  let eliteProfessionPrerequisites = {};

  for (const skillName in skillData.skills) {
    let skill = skillData.skills[skillName];
    if (skill.novice.skills_required.length) {
      skill.novice.skills_required.forEach(function (prereqSkill) {
        if (eliteProfessionPrerequisites[prereqSkill] == undefined) {
          eliteProfessionPrerequisites[prereqSkill] = [skill.name];
        } else if (
          !eliteProfessionPrerequisites[prereqSkill].includes(skill.name)
        ) {
          eliteProfessionPrerequisites[prereqSkill].push(skill.name);
        }

        if (eliteProfessionPrerequisites[skill.name] == undefined) {
          eliteProfessionPrerequisites[skill.name] = [prereqSkill];
        } else if (
          !eliteProfessionPrerequisites[skill.name].includes(prereqSkill)
        ) {
          eliteProfessionPrerequisites[skill.name].push(prereqSkill);
        }
      });
    }
  }

  return eliteProfessionPrerequisites;
}
