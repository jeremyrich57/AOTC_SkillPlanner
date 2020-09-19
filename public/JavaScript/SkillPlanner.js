var xhr = new XMLHttpRequest();
xhr.open("GET", "/api/getSkillData");
xhr.onload = function () {
  if (xhr.status === 200) {
    const data = JSON.parse(xhr.response);
    console.log(data);
    const skillPlanner = new SkillPlanner(data.SKILL_DATA);
  } else {
    console.log("Request failed.  Returned status of " + xhr.status);
  }
};
xhr.send();

function SkillPlanner(SKILL_DATA) {
  const skillPlanner = this;
  skillPlanner.skillData = SKILL_DATA;
  skillPlanner.skillPoints = 250;
  skillPlanner.remainingSkillPoints = 250;
  skillPlanner.mods = {};
  skillPlanner.experienceRequired = {};
  skillPlanner.professionsSelected = [];
  skillPlanner.eliteProfessions = {};
  skillPlanner.elitePrequesiteProfessions = {};
  skillPlanner.currentSelectedSkills = {};
  skillPlanner.mappedCurrentSkillNames = [];
  skillPlanner.noviceSkillBox = document.getElementsByClassName(
    "noviceSkillBoxLabel"
  )[0];
  skillPlanner.masterSkillBox = document.getElementsByClassName(
    "masterSkillBoxLabel"
  )[0];
  skillPlanner.skillTreeBoxes = document.getElementsByClassName(
    "professionSkillBox"
  );
  skillPlanner.newSkills = buildSkillInformation();

  document
    .getElementById("resetButton")
    .addEventListener("click", skillPlanner.resetPlanner.bind(skillPlanner));

  setUpEliteProfessionNames();
  skillPlanner.createProfessions();

  console.log(skillPlanner);

  // console.log(document.getElementsByClassName("tableHeaders"));
  // let headers = document.getElementsByClassName("tableHeaders");
  // Array.from(headers).forEach(function (header) {
  //   header.addEventListener("click", function () {
  //     skillPlanner.sortTable(skillPlanner, this.dataset.tableId, this);
  //   });
  // });

  //Loop through all the skills to see which have prerequisites for the links above the trees and master box
  //Shitty shortcut by doing a split, slice, and joining the first part of those names since it would be much more work to loop through every tree
  //and find the actual pre req profession name - this may break if profession structure ever changes
  function setUpEliteProfessionNames() {
    for (const skill in SKILL_DATA.skills) {
      let profession = SKILL_DATA.skills[skill];
      if (profession.novice.skills_required.length > 0) {
        for (let i = 0; i < profession.novice.skills_required.length; i++) {
          let prereqSkillName = profession.novice.skills_required[i];
          if (skillPlanner.eliteProfessions[prereqSkillName] == undefined) {
            skillPlanner.eliteProfessions[prereqSkillName] = [];
          }
          if (!skillPlanner.eliteProfessions[prereqSkillName].includes(skill)) {
            skillPlanner.eliteProfessions[prereqSkillName].push(skill);
          }

          let novicePrereqSkill = prereqSkillName
            .split("_")
            .slice(0, 2)
            .join("_");

          if (
            skillPlanner.elitePrequesiteProfessions[profession.name] ==
            undefined
          ) {
            skillPlanner.elitePrequesiteProfessions[profession.name] = [];
          }

          if (
            !skillPlanner.elitePrequesiteProfessions[profession.name].includes(
              novicePrereqSkill
            )
          ) {
            skillPlanner.elitePrequesiteProfessions[profession.name].push(
              novicePrereqSkill
            );
          }

          // skillPlanner.eliteProfessions[
          //   prereqSkillName
          // ].prerequisiteNoviceSkills.push(novicePrereqSkill);
        }
      }
    }
  }

  function buildSkillInformation() {
    let newSkills = {};
    let parentSkillName;
    let treeBaseIndex = 0; //Tree index for profession
    let skillIndex = 0; //Index for the skill inside the tree

    // newSkills[parentSkillName].trees = trees;
    SKILL_DATA.new_skills.forEach(function (skillRow) {
      //Make properties lower case because it's easier to read and that's how the code is set up
      let newSkillRow = Object.fromEntries(
        Object.entries(skillRow).map(([k, v]) => [k.toLowerCase(), v])
      );

      let trees;
      switch (newSkillRow.graph_type) {
        case "fourByFour":
          trees = new Array(4);
          for (let i = 0; i < trees.length; i++) {
            trees[i] = new Array(4);
          }
          break;
        case "oneByFour":
          trees = new Array(1);
          trees[0] = new Array(4);
          break;
        case "pyramid":
          trees = new Array(1);
          trees[0] = new Array(4);
          break;
        default:
          trees = new Array(4);
          for (let i = 0; i < trees.length; i++) {
            trees[i] = new Array(4);
          }
          break;
      }

      if (newSkillRow.is_hidden == "false") {
        if (newSkillRow.is_profession == "true") {
          parentSkillName = newSkillRow.name;
          // console.log("parent name", parentSkillName);
          newSkills[parentSkillName] = newSkillRow;
          // newSkills[parentSkillName].trees = [
          //   [[], [], [], []],
          //   [[], [], [], []],
          //   [[], [], [], []],
          //   [[], [], [], []],
          // ];

          newSkills[parentSkillName].category =
            newSkills[parentSkillName].parent;
          newSkills[parentSkillName].trees = trees;
          treeBaseIndex = 0;
          skillIndex = 0;
        } else if (
          newSkillRow.name.indexOf("novice") > -1 &&
          newSkillRow.parent == parentSkillName
        ) {
          if (newSkills[newSkillRow.parent] == undefined) {
            newSkills[newSkillRow.parent] = {};
            newSkills[newSkillRow.parent].novice = newSkillRow;
            newSkills[
              newSkillRow.parent
            ].novice.skills_required = newSkillRow.skills_required.split(",");
            newSkills[newSkillRow.parent].trees = trees;
          } else {
            newSkills[newSkillRow.parent].novice = newSkillRow;
            newSkills[
              newSkillRow.parent
            ].novice.skills_required = newSkillRow.skills_required.split(",");
          }

          newSkills[newSkillRow.parent].novice.skill_mods = newSkills[
            newSkillRow.parent
          ].novice.skill_mods.split(",");

          newSkills[newSkillRow.parent].novice.skill_mods.forEach(function (
            mod
          ) {
            let modName = mod.split("=")[0];
            let modValue = mod.split("=")[1];

            if (newSkills[newSkillRow.parent].novice.mods == undefined) {
              newSkills[newSkillRow.parent].novice.mods = {};
            }
            newSkills[newSkillRow.parent].novice.mods[modName] = parseFloat(
              modValue
            );
          });
        } else if (
          newSkillRow.name.indexOf("master") > -1 &&
          newSkillRow.parent == parentSkillName
        ) {
          if (newSkills[newSkillRow.parent] == undefined) {
            newSkills[newSkillRow.parent] = {};
            newSkills[newSkillRow.parent].master = newSkillRow;
            newSkills[newSkillRow.parent].trees = trees;
            newSkills[
              newSkillRow.parent
            ].master.skills_required = newSkillRow.skills_required.split(",");
          } else {
            newSkills[newSkillRow.parent].master = newSkillRow;
            newSkills[
              newSkillRow.parent
            ].master.skills_required = newSkillRow.skills_required.split(",");
          }

          newSkills[newSkillRow.parent].master.skill_mods = newSkills[
            newSkillRow.parent
          ].master.skill_mods.split(",");

          newSkills[newSkillRow.parent].master.skill_mods.forEach(function (
            mod
          ) {
            let modName = mod.split("=")[0];
            let modValue = mod.split("=")[1];

            if (newSkills[newSkillRow.parent].master.mods == undefined) {
              newSkills[newSkillRow.parent].master.mods = {};
            }
            newSkills[newSkillRow.parent].master.mods[modName] = parseFloat(
              modValue
            );
          });
        } else {
          if (
            newSkillRow.parent != "" &&
            newSkillRow.name.indexOf("language") < 0 &&
            newSkillRow.name.indexOf("species") < 0 &&
            newSkillRow.name.indexOf("pilot") < 0 &&
            newSkillRow.name.indexOf("gcw_currency") < 0 &&
            newSkills[parentSkillName] != undefined &&
            newSkills[parentSkillName].trees != undefined
          ) {
            try {
              if (
                newSkills[parentSkillName].trees.length &&
                newSkills[parentSkillName].trees[treeBaseIndex].length
              ) {
                newSkills[parentSkillName].trees[treeBaseIndex][
                  skillIndex
                ] = newSkillRow;

                newSkills[parentSkillName].trees[treeBaseIndex][
                  skillIndex
                ].skill_mods = newSkills[parentSkillName].trees[treeBaseIndex][
                  skillIndex
                ].skill_mods.split(",");

                newSkills[parentSkillName].trees[treeBaseIndex][
                  skillIndex
                ].skill_mods.forEach(function (mod) {
                  let modName = mod.split("=")[0];
                  let modValue = mod.split("=")[1];

                  if (
                    newSkills[parentSkillName].trees[treeBaseIndex][skillIndex]
                      .mods == undefined
                  ) {
                    newSkills[parentSkillName].trees[treeBaseIndex][
                      skillIndex
                    ].mods = {};
                  }
                  newSkills[parentSkillName].trees[treeBaseIndex][
                    skillIndex
                  ].mods[modName] = parseFloat(modValue);
                });
              }

              switch (newSkillRow.graph_type) {
                case "fourByFour":
                  if (newSkillRow.name.slice(-2) == "04") {
                    // console.log("new tree", newSkillRow.name);
                    treeBaseIndex++;
                    skillIndex = 0;
                  } else {
                    skillIndex++;
                  }
                  break;
                case "oneByFour":
                  skillIndex++;
                  break;
                case "pyramid":
                  skillIndex++;
                  break;
                default:
                  if (newSkillRow.name.slice(-2) == "04") {
                    // console.log("new tree", newSkillRow.name);
                    treeBaseIndex++;
                    skillIndex = 0;
                  } else {
                    skillIndex++;
                  }
                  break;
              }
            } catch (e) {
              console.log(newSkills[parentSkillName]);
              console.log("index", treeBaseIndex, skillIndex);
            }
          }
        }
      }
    });

    return newSkills;
  }
}

//TODO: Fix this sort and make it more elegant
SkillPlanner.prototype.sortTable = function (skillPlanner, tableID, header) {
  // var table, rows, switching, i, x, y, shouldSwitch;
  // table = document.getElementById(tableID);
  // switching = true;
  /*Make a loop that will continue until
  no switching has been done:*/
  // while (switching) {
  //   //start by saying: no switching is done:
  //   switching = false;
  //   rows = table.rows;
  //   /*Loop through all table rows (except the
  //   first, which contains table headers):*/
  //   for (i = 1; i < rows.length - 1; i++) {
  //     //start by saying there should be no switching:
  //     shouldSwitch = false;
  //     /*Get the two elements you want to compare,
  //     one from current row and one from the next:*/
  //     x = rows[i].getElementsByTagName("TD")[0];
  //     y = rows[i + 1].getElementsByTagName("TD")[0];
  //     //check if the two rows should switch place:
  //     if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
  //       //if so, mark as a switch and break the loop:
  //       shouldSwitch = true;
  //       break;
  //     }
  //   }
  //   if (shouldSwitch) {
  //     /*If a switch has been marked, make the switch
  //     and mark that a switch has been done:*/
  //     rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
  //     switching = true;
  //   }
  // }
  let headers = document.getElementById(tableID).getElementsByTagName("th");
  let tableBody = document.getElementById(tableID).tBodies[0];
  tableBody.innerHTML = "";

  let rows = [];

  if (tableID == "tableSkillMods") {
    for (const mod in skillPlanner.mods) {
      rows.push({
        mod: mod,
        value: skillPlanner.mods[mod],
      });
    }

    if (header.textContent.indexOf("Name") > -1) {
      if (header.textContent.indexOf("▼") > -1) {
        rows.sort(function (a, b) {
          if (
            skillPlanner.skillData.stat_names[a.mod] >
            skillPlanner.skillData.stat_names[b.mod]
          ) {
            return -1;
          } else if (
            skillPlanner.skillData.stat_names[a.mod] <
            skillPlanner.skillData.stat_names[b.mod]
          ) {
            return 1;
          } else {
            return 0;
          }
        });
        header.innerHTML = "Name &#9650";
        headers[1].textContent = "Value";
      } else {
        rows.sort(function (a, b) {
          if (
            skillPlanner.skillData.stat_names[a.mod] >
            skillPlanner.skillData.stat_names[b.mod]
          ) {
            return 1;
          } else if (
            skillPlanner.skillData.stat_names[a.mod] <
            skillPlanner.skillData.stat_names[b.mod]
          ) {
            return -1;
          } else {
            return 0;
          }
        });
        header.innerHTML = "Name &#9660";
        headers[1].textContent = "Value";
      }
    } else if (header.textContent.indexOf("Value") > -1) {
      if (header.textContent.indexOf("▼") > -1) {
        rows.sort(function (a, b) {
          if (a.value > b.value) {
            return -1;
          } else if (a.value < b.value) {
            return 1;
          } else {
            return 0;
          }
        });
        header.innerHTML = "Value &#9650";
        headers[0].textContent = "Name";
      } else {
        rows.sort(function (a, b) {
          if (a.value > b.value) {
            return 1;
          } else if (a.value < b.value) {
            return -1;
          } else {
            return 0;
          }
        });
        header.innerHTML = "Value &#9660";
        headers[0].textContent = "Value";
      }
    }

    for (let i = 0; i < rows.length; i++) {
      let row = document.createElement("tr");
      let modNameCell = document.createElement("td");
      let modValueCell = document.createElement("td");
      let modName =
        skillPlanner.skillData.stat_names[rows[i].mod] == undefined
          ? rows[i].mod
          : skillPlanner.skillData.stat_names[rows[i].mod];

      modNameCell.appendChild(document.createTextNode(modName));
      row.appendChild(modNameCell);

      modValueCell.appendChild(document.createTextNode(rows[i].value));
      row.appendChild(modValueCell);

      tableBody.appendChild(row);
    }
  } else if (tableID == "tableExperienceRequired") {
    for (const xpType in skillPlanner.experienceRequired) {
      rows.push({
        xpType: xpType,
        value: skillPlanner.mods[mod],
      });
    }

    for (let i = 0; i < rows.length; i++) {
      let row = document.createElement("tr");
      let xpNameCell = document.createElement("td");
      let xpValueCell = document.createElement("td");
      let xpName =
        skillPlanner.skillData.exp_names[rows[i].xpType] == undefined
          ? xpType
          : skillPlanner.skillData.exp_names[rows[i].xpType];

      xpNameCell.appendChild(document.createTextNode(xpName));
      row.appendChild(xpNameCell);

      xpValueCell.appendChild(document.createTextNode(rows[i].value));
      row.appendChild(xpValueCell);

      tableXPBody.appendChild(row);
    }
  }
};

SkillPlanner.prototype.createProfessions = function () {
  const skillPlanner = this;
  let noviceProfessions = [];
  let eliteProfessions = [];
  let jediProfessions = [];
  let forceSensitiveProfessions = []; //Will probably go away
  let pilotProfessions = []; //Not implemented yet

  for (const skill in skillPlanner.skillData.skills) {
    switch (skillPlanner.skillData.skills[skill].category) {
      case "force_discipline":
        jediProfessions.push(skillPlanner.skillData.skills[skill]);
        skillPlanner.skillData.skills[skill].novice.skills_required = [];
        break;
      case "force_sensitive":
        forceSensitiveProfessions.push(skillPlanner.skillData.skills[skill]);
        break;
      case "pilot":
        pilotProfessions.push(skillPlanner.skillData.skills[skill]);
        break;
      case "combat":
        if (
          skillPlanner.skillData.skills[skill].novice.skills_required.length > 0
        ) {
          eliteProfessions.push(skillPlanner.skillData.skills[skill]);
        } else {
          noviceProfessions.push(skillPlanner.skillData.skills[skill]);
        }
        break;
      case "crafting":
        if (
          skillPlanner.skillData.skills[skill].novice.skills_required.length > 0
        ) {
          eliteProfessions.push(skillPlanner.skillData.skills[skill]);
        } else {
          noviceProfessions.push(skillPlanner.skillData.skills[skill]);
        }
        break;
      case "shipwright":
        if (
          skillPlanner.skillData.skills[skill].novice.skills_required.length > 0
        ) {
          eliteProfessions.push(skillPlanner.skillData.skills[skill]);
        } else {
          noviceProfessions.push(skillPlanner.skillData.skills[skill]);
        }
        break;
      case "outdoors":
        if (
          skillPlanner.skillData.skills[skill].novice.skills_required.length > 0
        ) {
          eliteProfessions.push(skillPlanner.skillData.skills[skill]);
        } else {
          noviceProfessions.push(skillPlanner.skillData.skills[skill]);
        }
        break;
      case "science":
        if (
          skillPlanner.skillData.skills[skill].novice.skills_required.length > 0
        ) {
          eliteProfessions.push(skillPlanner.skillData.skills[skill]);
        } else {
          noviceProfessions.push(skillPlanner.skillData.skills[skill]);
        }
        break;
      case "social":
        if (
          skillPlanner.skillData.skills[skill].novice.skills_required.length > 0
        ) {
          eliteProfessions.push(skillPlanner.skillData.skills[skill]);
        } else {
          noviceProfessions.push(skillPlanner.skillData.skills[skill]);
        }
        break;
    }
  }

  noviceProfessions.sort(sortProfessionNames);
  eliteProfessions.sort(sortProfessionNames);
  jediProfessions.sort(sortProfessionNames);
  forceSensitiveProfessions.sort(sortProfessionNames);
  pilotProfessions.sort(sortProfessionNames);

  let ul = document.getElementById("listProfessions");
  noviceProfessions.forEach(function (profession, index) {
    let li = document.createElement("li");
    li.appendChild(
      document.createTextNode(
        skillPlanner.skillData.skill_names[profession.name]
      )
    );
    li.setAttribute("data-skill-name", profession.name);
    li.classList.add("professionListItem");
    ul.appendChild(li);
  });

  let hr = document.createElement("hr");
  ul.appendChild(hr);

  eliteProfessions.forEach(function (profession, index) {
    let li = document.createElement("li");
    li.appendChild(
      document.createTextNode(
        skillPlanner.skillData.skill_names[profession.name]
      )
    );
    li.setAttribute("data-skill-name", profession.name);
    li.classList.add("professionListItem");
    ul.appendChild(li);
  });

  hr = document.createElement("hr");
  ul.appendChild(hr);

  jediProfessions.forEach(function (profession, index) {
    let li = document.createElement("li");
    li.appendChild(
      document.createTextNode(
        skillPlanner.skillData.skill_names[profession.name]
      )
    );
    li.setAttribute("data-skill-name", profession.name);
    li.classList.add("professionListItem");
    ul.appendChild(li);
  });

  hr = document.createElement("hr");
  ul.appendChild(hr);

  forceSensitiveProfessions.forEach(function (profession, index) {
    let li = document.createElement("li");
    li.appendChild(
      document.createTextNode(
        skillPlanner.skillData.skill_names[profession.name]
      )
    );
    li.setAttribute("data-skill-name", profession.name);
    li.classList.add("professionListItem");
    ul.appendChild(li);
  });

  skillPlanner.addClickEventsToProfessionList();
  skillPlanner.addHoverEventForProfessionTooltip();
  skillPlanner.addClickEventToSkillBox();

  //Default open page to artisan
  skillPlanner.clickProfessionListItem("crafting_artisan");

  function sortProfessionNames(a, b) {
    if (
      skillPlanner.skillData.skill_names[a.name] >
      skillPlanner.skillData.skill_names[b.name]
    ) {
      return 1;
    } else if (
      skillPlanner.skillData.skill_names[a.name] <
      skillPlanner.skillData.skill_names[b.name]
    ) {
      return -1;
    } else {
      return 0;
    }
  }
};

SkillPlanner.prototype.addClickEventsToProfessionList = function () {
  let skillPlanner = this;
  let professionListItems = document.getElementsByClassName(
    "professionListItem"
  );

  Array.from(professionListItems).forEach(function (profession) {
    profession.addEventListener(
      "click",
      skillPlanner.clickProfessionListItem.bind(skillPlanner)
    );
  });
};

SkillPlanner.prototype.clickProfessionListItem = function (e) {
  if (
    e.target != undefined &&
    e.target.classList.contains("cancelSelectedProfessionBox")
  ) {
    return;
  }

  const skillPlanner = this;
  const professionListItem = e.target;
  const skillDataName =
    typeof arguments[0] == "string"
      ? arguments[0]
      : professionListItem.dataset.skillName;
  const noviceLabelName =
    skillPlanner.skillData.skill_names[
      skillPlanner.skillData.skills[skillDataName].novice.name
    ];
  const masterLabelName =
    skillPlanner.skillData.skill_names[
      skillPlanner.skillData.skills[skillDataName].master.name
    ];

  const skillTitleName = skillPlanner.skillData.skill_names[skillDataName];
  document.querySelector(".skillName").textContent = skillTitleName;

  //Check if was click event on list item or start of page with selected profession
  if (typeof arguments[0] != "string") {
    let activeProfession = document.getElementsByClassName("activeProfession");

    if (activeProfession) {
      for (let i = 0; i < activeProfession.length; i++) {
        activeProfession[i].classList.remove("activeProfession");
      }
    }
    document
      .querySelector('li[data-skill-name="' + skillDataName + '"]')
      .classList.add("activeProfession");
  } else {
    document
      .querySelector('li[data-skill-name="' + skillDataName + '"]')
      .classList.add("activeProfession");
  }

  //Update Novice and Master Box Labels
  let noviceSkillBox = skillPlanner.noviceSkillBox;
  noviceSkillBox.textContent = noviceLabelName;
  noviceSkillBox.dataset.skillName =
    skillPlanner.skillData.skills[skillDataName].novice.name;
  noviceSkillBox.dataset.baseSkillName = skillDataName;
  let masterSkillBox = skillPlanner.masterSkillBox;
  masterSkillBox.textContent = masterLabelName;
  masterSkillBox.dataset.skillName =
    skillPlanner.skillData.skills[skillDataName].master.name;
  masterSkillBox.dataset.baseSkillName = skillDataName;

  //Get rid of elite profession links over trees
  let topEliteSkillsDiv = document.querySelector(".topMasterEliteSkillsText");
  topEliteSkillsDiv.innerHTML = "";

  //add elite profession links over trees if they exist
  let masterSkillName =
    skillPlanner.skillData.skills[skillDataName].master.name;

  let topEliteProfessionList =
    skillPlanner.eliteProfessions[masterSkillName] == undefined
      ? []
      : skillPlanner.eliteProfessions[masterSkillName];
  if (
    topEliteProfessionList != undefined &&
    topEliteProfessionList.length > 0
  ) {
    topEliteProfessionList.forEach(function (eliteProfession) {
      let span = document.createElement("span");
      let eliteProfessionName =
        skillPlanner.skillData.skill_names[eliteProfession];
      span.appendChild(document.createTextNode(eliteProfessionName));
      span.dataset.skillName = eliteProfession;

      span.addEventListener(
        "click",
        skillPlanner.clickProfessionListItem.bind(skillPlanner)
      );

      topEliteSkillsDiv.appendChild(span);
    });
  }

  //Update Skill Boxes
  let professionSkillTrees = skillPlanner.skillData.skills[skillDataName].trees;
  skillPlanner.currentSkillTrees = professionSkillTrees;

  Array.from(skillPlanner.skillTreeBoxes).forEach(function (skillBox) {
    // if (!skillBox.classList.contains("largeSkillBox")) {
    let rowIndex = parseInt(skillBox.dataset.row);
    let colIndex = parseInt(skillBox.dataset.col);
    let skillBoxName =
      skillPlanner.skillData.skill_names[
        professionSkillTrees[colIndex][rowIndex].name
      ];
    let skillName = professionSkillTrees[colIndex][rowIndex].name;

    skillBox.textContent = skillBoxName;
    skillBox.dataset.skillName = skillName;
    skillBox.dataset.baseSkillName = skillDataName;

    //Get rid of elite profession links over trees
    let eliteSkillsDiv = document.querySelector(
      '.eliteSkillsText[data-elite-col="' + colIndex + '"]'
    );
    eliteSkillsDiv.innerHTML = "";

    //add elite profession links over trees if they exist
    if (rowIndex == 3) {
      let eliteProfessionList =
        skillPlanner.eliteProfessions[skillName] == undefined
          ? []
          : skillPlanner.eliteProfessions[skillName];

      if (eliteProfessionList != undefined && eliteProfessionList.length > 0) {
        eliteProfessionList.forEach(function (eliteProfession) {
          let span = document.createElement("span");
          let eliteProfessionName =
            skillPlanner.skillData.skill_names[eliteProfession];
          span.appendChild(document.createTextNode(eliteProfessionName));
          span.dataset.skillName = eliteProfession;

          span.addEventListener(
            "click",
            skillPlanner.clickProfessionListItem.bind(skillPlanner)
          );

          eliteSkillsDiv.appendChild(span);
        });
      }
    }
    // }

    //TODO: Check if saved skills are still active and leave alone, else remove active class
    skillBox.classList.remove("active");
  });

  //Add prerequesite skill links below novice box if there is one
  let prereqSkillsDiv = document.getElementsByClassName(
    "prerequesitSkillsText"
  )[0];
  prereqSkillsDiv.innerHTML = "";
  let elitePrereqs =
    skillPlanner.elitePrequesiteProfessions[skillDataName] == undefined
      ? []
      : skillPlanner.elitePrequesiteProfessions[skillDataName];
  for (let i = 0; i < elitePrereqs.length; i++) {
    let span = document.createElement("span");
    let prereqSkillName = skillPlanner.skillData.skill_names[elitePrereqs[i]];
    span.appendChild(document.createTextNode(prereqSkillName));
    span.dataset.skillName = elitePrereqs[i];

    span.addEventListener(
      "click",
      skillPlanner.clickProfessionListItem.bind(skillPlanner)
    );

    prereqSkillsDiv.appendChild(span);
  }

  skillPlanner.updateSkillPlannerDOM();
};

SkillPlanner.prototype.addClickEventToSkillBox = function () {
  const skillPlanner = this;

  Array.from(skillPlanner.skillTreeBoxes).forEach(function (skillBox) {
    skillBox.addEventListener("click", function (e) {
      if (e.target != this) {
        return;
      }
      let rowIndex = parseInt(this.dataset.row);
      let colIndex = parseInt(this.dataset.col);
      let baseSkill = skillPlanner.noviceSkillBox.dataset.baseSkillName;
      let preRequisteSkills =
        skillPlanner.skillData.skills[baseSkill].novice.skills_required;
      let hasMetAllPrerequisteSkills = true;

      if (preRequisteSkills.length > 0) {
        if (skillPlanner.mappedCurrentSkillNames == undefined) {
          hasMetAllPrerequisteSkills = false;
        } else {
          preRequisteSkills.forEach(function (skill) {
            if (!skillPlanner.mappedCurrentSkillNames.includes(skill)) {
              hasMetAllPrerequisteSkills = false;
            }
          });
        }
      }

      if (hasMetAllPrerequisteSkills == false) {
        updatePrerequisiteSkills(preRequisteSkills);
      }

      if (
        skillPlanner.currentSelectedSkills[baseSkill] == undefined &&
        skillPlanner.remainingSkillPoints -
          skillPlanner.skillData.skills[baseSkill].novice.skillpoint_cost >=
          0
      ) {
        let skillPoints =
          skillPlanner.skillData.skills[baseSkill].novice.skillpoint_cost;

        //added new skill
        skillPlanner.currentSelectedSkills[baseSkill] = {
          trees: [[], [], [], []],
          master: {},
          novice: skillPlanner.skillData.skills[baseSkill].novice,
        };

        let tree = skillPlanner.currentSkillTrees[colIndex].slice(
          0,
          rowIndex + 1
        );

        let mappedSkillNames = [
          skillPlanner.skillData.skills[baseSkill].novice.name,
        ];
        tree.forEach(function (skill) {
          if (skillPlanner.remainingSkillPoints - skill.skillpoint_cost >= 0) {
            mappedSkillNames.push(skill.name);
            // skillPoints += skill.skillpoint_cost;
            skillPlanner.remainingSkillPoints -= skill.skillpoint_cost;
            skillPlanner.currentSelectedSkills[baseSkill].trees[colIndex].push(
              skill
            );
          }
        });

        if (skillPlanner.mappedCurrentSkillNames == undefined) {
          skillPlanner.mappedCurrentSkillNames = mappedSkillNames;
        } else {
          skillPlanner.mappedCurrentSkillNames = skillPlanner.mappedCurrentSkillNames.concat(
            mappedSkillNames
          );
        }

        // skillPlanner.remainingSkillPoints -= skillPoints;
      } else if (
        skillPlanner.currentSelectedSkills[baseSkill].trees[colIndex][
          rowIndex
        ] == undefined
      ) {
        //add skills to trees
        let tree = skillPlanner.currentSkillTrees[colIndex].slice(
          0,
          rowIndex + 1
        );

        let skillPoints = 0;
        tree.forEach(function (skill) {
          if (
            !skillPlanner.mappedCurrentSkillNames.includes(skill.name) &&
            skillPlanner.remainingSkillPoints - skill.skillpoint_cost >= 0
          ) {
            skillPlanner.mappedCurrentSkillNames.push(skill.name);
            // skillPoints += skill.skillpoint_cost;
            skillPlanner.remainingSkillPoints -= skill.skillpoint_cost;
            skillPlanner.currentSelectedSkills[baseSkill].trees[colIndex].push(
              skill
            );
          }
        });

        // skillPlanner.remainingSkillPoints -= skillPoints;
      } else {
        //remove skills from trees
        let tree = skillPlanner.currentSelectedSkills[baseSkill].trees[
          colIndex
        ].slice(0, rowIndex);

        skillPlanner.removeEliteSkills(baseSkill);

        let removedTreeSkills = skillPlanner.currentSelectedSkills[
          baseSkill
        ].trees[colIndex].slice(
          rowIndex -
            skillPlanner.currentSelectedSkills[baseSkill].trees[colIndex].length
        );
        let skillPoints = 0;

        if (
          skillPlanner.mappedCurrentSkillNames.includes(
            skillPlanner.currentSelectedSkills[baseSkill].master.name
          )
        ) {
          skillPlanner.mappedCurrentSkillNames.splice(
            skillPlanner.mappedCurrentSkillNames.indexOf(
              skillPlanner.currentSelectedSkills[baseSkill].master.name
            ),
            1
          );

          // skillPoints +=
          // skillPlanner.currentSelectedSkills[baseSkill].master
          //   .skillpoint_cost;
          skillPlanner.remainingSkillPoints +=
            skillPlanner.currentSelectedSkills[
              baseSkill
            ].master.skillpoint_cost;
        }

        removedTreeSkills.forEach(function (skill) {
          if (skillPlanner.mappedCurrentSkillNames.includes(skill.name)) {
            skillPlanner.mappedCurrentSkillNames.splice(
              skillPlanner.mappedCurrentSkillNames.indexOf(skill.name),
              1
            );

            // skillPoints += skill.skillpoint_cost;
            skillPlanner.remainingSkillPoints += skill.skillpoint_cost;
          }
        });

        skillPlanner.currentSelectedSkills[baseSkill].trees[colIndex] = tree;
        skillPlanner.currentSelectedSkills[baseSkill].master = {};

        // skillPlanner.remainingSkillPoints += skillPoints;
      }

      skillPlanner.updateSkillPlannerDOM();
    });
  });

  //Novice Done - TODO: Master and Skill boxes - Use similar logic in else if hasMetAllPrerequsisteSkills == false
  skillPlanner.noviceSkillBox.addEventListener("click", function (e) {
    if (e.target != this) {
      return;
    }
    let baseSkill = this.dataset.baseSkillName;
    let noviceSkillPointCost =
      skillPlanner.skillData.skills[baseSkill].novice.skillpoint_cost;
    let preRequisteSkills =
      skillPlanner.skillData.skills[baseSkill].novice.skills_required;
    let hasMetAllPrerequisteSkills = true;

    if (preRequisteSkills.length > 0) {
      if (skillPlanner.mappedCurrentSkillNames == undefined) {
        hasMetAllPrerequisteSkills = false;
      } else {
        preRequisteSkills.forEach(function (skill) {
          if (!skillPlanner.mappedCurrentSkillNames.includes(skill)) {
            hasMetAllPrerequisteSkills = false;
          }
        });
      }
    }

    if (hasMetAllPrerequisteSkills == false) {
      updatePrerequisiteSkills(preRequisteSkills);
    }

    //Make sure they can add novice skillbox
    if (
      skillPlanner.remainingSkillPoints - noviceSkillPointCost >= 0 &&
      skillPlanner.currentSelectedSkills[baseSkill] == undefined
    ) {
      skillPlanner.currentSelectedSkills[baseSkill] = {
        trees: [[], [], [], []],
        master: {},
        novice: skillPlanner.skillData.skills[baseSkill].novice,
      };
      if (skillPlanner.mappedCurrentSkillNames == undefined) {
        skillPlanner.mappedCurrentSkillNames = [
          skillPlanner.skillData.skills[baseSkill].novice.name,
        ];
      } else if (
        !skillPlanner.mappedCurrentSkillNames.includes(
          skillPlanner.skillData.skills[baseSkill].novice.name
        )
      ) {
        skillPlanner.mappedCurrentSkillNames.push(
          skillPlanner.skillData.skills[baseSkill].novice.name
        );
      }

      skillPlanner.remainingSkillPoints -= noviceSkillPointCost;
    } else {
      skillPlanner.removeEliteSkills(baseSkill);

      if (
        skillPlanner.mappedCurrentSkillNames.includes(
          skillPlanner.skillData.skills[baseSkill].master.name
        )
      ) {
        skillPlanner.mappedCurrentSkillNames.splice(
          skillPlanner.mappedCurrentSkillNames.indexOf(
            skillPlanner.skillData.skills[baseSkill].master.name
          ),
          1
        );

        skillPlanner.currentSelectedSkills[baseSkill].master = {};

        skillPlanner.remainingSkillPoints +=
          skillPlanner.skillData.skills[baseSkill].master.skillpoint_cost;
      }

      skillPlanner.currentSelectedSkills[baseSkill].trees.forEach(function (
        tree
      ) {
        for (let i = tree.length - 1; i >= 0; i--) {
          if (skillPlanner.mappedCurrentSkillNames.includes(tree[i].name)) {
            skillPlanner.mappedCurrentSkillNames.splice(
              skillPlanner.mappedCurrentSkillNames.indexOf(tree[i].name),
              1
            );
            skillPlanner.remainingSkillPoints += tree[i].skillpoint_cost;
            tree.splice(i, 1);
          }
        }
      });

      let deleteNovice = true;
      skillPlanner.currentSelectedSkills[baseSkill].trees.forEach(function (
        tree
      ) {
        if (tree.length > 0) {
          deleteNovice = false;
        }
      });

      if (deleteNovice) {
        delete skillPlanner.currentSelectedSkills[baseSkill];
        skillPlanner.remainingSkillPoints += noviceSkillPointCost;
        skillPlanner.mappedCurrentSkillNames.splice(
          skillPlanner.mappedCurrentSkillNames.indexOf(
            skillPlanner.skillData.skills[baseSkill].novice.name
          ),
          1
        );
      }
    }

    skillPlanner.updateSkillPlannerDOM();
  });

  skillPlanner.masterSkillBox.addEventListener("click", function (e) {
    if (e.target != this) {
      return;
    }
    let baseSkill = this.dataset.baseSkillName;
    let skillPoints = 0;
    let masterSkillPointCost =
      skillPlanner.skillData.skills[baseSkill].master.skillpoint_cost;
    let noviceSkillPointCost =
      skillPlanner.skillData.skills[baseSkill].novice.skillpoint_cost;
    let prerequisiteSkills =
      skillPlanner.skillData.skills[baseSkill].novice.skills_required;
    let hasMetAllPrerequisteSkills = true;

    if (prerequisiteSkills.length > 0) {
      if (skillPlanner.mappedCurrentSkillNames == undefined) {
        hasMetAllPrerequisteSkills = false;
      } else {
        prerequisiteSkills.forEach(function (skill) {
          if (!skillPlanner.mappedCurrentSkillNames.includes(skill)) {
            hasMetAllPrerequisteSkills = false;
          }
        });
      }
    }

    if (hasMetAllPrerequisteSkills == false) {
      updatePrerequisiteSkills(prerequisiteSkills);
    }

    if (
      skillPlanner.currentSelectedSkills[baseSkill] == undefined &&
      skillPlanner.remainingSkillPoints -
        skillPlanner.skillData.skills[baseSkill].novice.skillpoint_cost >=
        0
    ) {
      skillPlanner.currentSelectedSkills[baseSkill] = {
        trees: [[], [], [], []],
        master: {},
        novice: skillPlanner.skillData.skills[baseSkill].novice,
      };

      skillPlanner.remainingSkillPoints -= noviceSkillPointCost;

      //Add base novice name to mapped skill names
      if (
        !skillPlanner.mappedCurrentSkillNames.includes(
          skillPlanner.skillData.skills[baseSkill].novice.name
        )
      ) {
        skillPlanner.mappedCurrentSkillNames.push(
          skillPlanner.skillData.skills[baseSkill].novice.name
        );
      }

      //Trees
      let treeIndex = 0;

      skillPlanner.currentSkillTrees.forEach(function (skillTree) {
        let tree = [];
        skillTree.forEach(function (skill) {
          if (
            !skillPlanner.mappedCurrentSkillNames.includes(skill.name) &&
            skillPlanner.remainingSkillPoints - skill.skillpoint_cost >= 0
          ) {
            skillPlanner.mappedCurrentSkillNames.push(skill.name);
            tree.push(skill);
            skillPlanner.remainingSkillPoints -= skill.skillpoint_cost;
          }
        });
        skillPlanner.currentSelectedSkills[baseSkill].trees[treeIndex] = tree;
        treeIndex++;
      });

      if (skillPlanner.remainingSkillPoints - masterSkillPointCost >= 0) {
        skillPlanner.currentSelectedSkills[baseSkill].master =
          skillPlanner.skillData.skills[baseSkill].master;
        skillPlanner.remainingSkillPoints -= masterSkillPointCost;
        if (
          !skillPlanner.mappedCurrentSkillNames.includes(
            skillPlanner.skillData.skills[baseSkill].master.name
          )
        ) {
          skillPlanner.mappedCurrentSkillNames.push(
            skillPlanner.skillData.skills[baseSkill].master.name
          );
        }
      }

      //TODO: add novice if needed and skill tree points

      // skillPlanner.remainingSkillPoints -= skillPoints;
    } else if (
      skillPlanner.currentSelectedSkills[baseSkill].master.name == undefined
    ) {
      let treeIndex = 0;

      skillPlanner.currentSkillTrees.forEach(function (skillTree) {
        skillTree.forEach(function (skill) {
          if (
            !skillPlanner.mappedCurrentSkillNames.includes(skill.name) &&
            skillPlanner.remainingSkillPoints - skill.skillpoint_cost >= 0
          ) {
            skillPlanner.mappedCurrentSkillNames.push(skill.name);
            skillPlanner.currentSelectedSkills[baseSkill].trees[treeIndex].push(
              skill
            );
            skillPlanner.remainingSkillPoints -= skill.skillpoint_cost;
          }
        });
        // skillPlanner.currentSelectedSkills[baseSkill].trees[treeIndex] = tree;
        treeIndex++;
      });

      if (skillPlanner.remainingSkillPoints - masterSkillPointCost >= 0) {
        skillPlanner.currentSelectedSkills[baseSkill].master =
          skillPlanner.skillData.skills[baseSkill].master;
        skillPlanner.remainingSkillPoints -= masterSkillPointCost;
        if (
          !skillPlanner.mappedCurrentSkillNames.includes(
            skillPlanner.skillData.skills[baseSkill].master.name
          )
        ) {
          skillPlanner.mappedCurrentSkillNames.push(
            skillPlanner.skillData.skills[baseSkill].master.name
          );
        }
      }
    } else {
      skillPlanner.currentSelectedSkills[baseSkill].master = {};
      skillPlanner.mappedCurrentSkillNames.splice(
        skillPlanner.mappedCurrentSkillNames.indexOf(
          skillPlanner.skillData.skills[baseSkill].master.name
        ),
        1
      );

      skillPlanner.remainingSkillPoints +=
        skillPlanner.skillData.skills[baseSkill].master.skillpoint_cost;

      skillPlanner.removeEliteSkills(baseSkill);
    }

    skillPlanner.updateSkillPlannerDOM();
  });

  function updatePrerequisiteSkills(prerequisiteSkills) {
    //See if they can auto add skills
    prerequisiteSkills.forEach(function (skill) {
      let novicePrereqSkill = skill.split("_").slice(0, 2).join("_");

      if (skillPlanner.currentSelectedSkills[novicePrereqSkill] == undefined) {
        let prereqNoviceSkillPoints =
          skillPlanner.skillData.skills[novicePrereqSkill].novice
            .skillpoint_cost;
        if (skillPlanner.remainingSkillPoints - prereqNoviceSkillPoints >= 0) {
          skillPlanner.remainingSkillPoints -= prereqNoviceSkillPoints;
          skillPlanner.currentSelectedSkills[novicePrereqSkill] = {
            trees: [[], [], [], []],
            master: {},
            novice: skillPlanner.skillData.skills[novicePrereqSkill].novice,
          };

          if (
            !skillPlanner.mappedCurrentSkillNames.includes(
              skillPlanner.skillData.skills[novicePrereqSkill].novice.name
            )
          ) {
            skillPlanner.mappedCurrentSkillNames.push(
              skillPlanner.skillData.skills[novicePrereqSkill].novice.name
            );
          }
        }
      }

      let prereqSkillTrees =
        skillPlanner.skillData.skills[novicePrereqSkill].trees;
      let treeIndex = 0;

      prereqSkillTrees.forEach(function (prereqSkillTree) {
        let tree = [];

        prereqSkillTree.forEach(function (prereqSkill) {
          if (skill.indexOf("master") > -1) {
            if (
              skillPlanner.remainingSkillPoints - prereqSkill.skillpoint_cost >=
                0 &&
              !skillPlanner.mappedCurrentSkillNames.includes(prereqSkill.name)
            ) {
              skillPlanner.mappedCurrentSkillNames.push(prereqSkill.name);
              tree.push(prereqSkill);
              skillPlanner.remainingSkillPoints -= prereqSkill.skillpoint_cost;
            }
          } else if (prereqSkillTree[3].name == skill) {
            if (
              !skillPlanner.mappedCurrentSkillNames.includes(
                prereqSkill.name
              ) &&
              skillPlanner.remainingSkillPoints - prereqSkill.skillpoint_cost >=
                0
            ) {
              skillPlanner.mappedCurrentSkillNames.push(prereqSkill.name);
              tree.push(prereqSkill);
              skillPlanner.remainingSkillPoints -= prereqSkill.skillpoint_cost;
            }
          }
        });
        //Should only add to new skills and keep old trees that have already be allocated
        if (tree.length > 0) {
          skillPlanner.currentSelectedSkills[novicePrereqSkill].trees[
            treeIndex
          ] = tree;
        }

        treeIndex++;
      });

      if (
        skill.indexOf("master") > -1 &&
        skillPlanner.remainingSkillPoints -
          skillPlanner.skillData.skills[novicePrereqSkill].master
            .skillpoint_cost >=
          0 &&
        !skillPlanner.mappedCurrentSkillNames.includes(
          skillPlanner.skillData.skills[novicePrereqSkill].master.name
        )
      ) {
        skillPlanner.remainingSkillPoints -=
          skillPlanner.skillData.skills[
            novicePrereqSkill
          ].master.skillpoint_cost;
        skillPlanner.currentSelectedSkills[novicePrereqSkill].master =
          skillPlanner.skillData.skills[novicePrereqSkill].master;

        skillPlanner.mappedCurrentSkillNames.push(
          skillPlanner.skillData.skills[novicePrereqSkill].master.name
        );
      }
    });
  }
};

SkillPlanner.prototype.removeEliteSkills = function (baseSkill) {
  let skillPlanner = this;
  for (const skill in skillPlanner.currentSelectedSkills) {
    let tempSkill = skillPlanner.currentSelectedSkills[skill];
    if (tempSkill.novice.skills_required.length > 0) {
      tempSkill.novice.skills_required.forEach(function (skillRequired) {
        let tempBaseSkill = skillRequired.split("_").slice(0, 2).join("_");
        if (
          baseSkill == tempBaseSkill &&
          skillPlanner.mappedCurrentSkillNames.includes(skillRequired)
        ) {
          if (
            skillPlanner.mappedCurrentSkillNames.includes(
              skillPlanner.skillData.skills[skill].master.name
            )
          ) {
            skillPlanner.mappedCurrentSkillNames.splice(
              skillPlanner.mappedCurrentSkillNames.indexOf(
                skillPlanner.skillData.skills[skill].master.name
              ),
              1
            );

            skillPlanner.currentSelectedSkills[skill].master = {};

            skillPlanner.remainingSkillPoints +=
              skillPlanner.skillData.skills[skill].master.skillpoint_cost;
          }

          if (skillPlanner.currentSelectedSkills[skill] != undefined) {
            skillPlanner.currentSelectedSkills[skill].trees.forEach(function (
              tree
            ) {
              for (let i = tree.length - 1; i >= 0; i--) {
                if (
                  skillPlanner.mappedCurrentSkillNames.includes(tree[i].name)
                ) {
                  skillPlanner.mappedCurrentSkillNames.splice(
                    skillPlanner.mappedCurrentSkillNames.indexOf(tree[i].name),
                    1
                  );
                  skillPlanner.remainingSkillPoints += tree[i].skillpoint_cost;
                  tree.splice(i, 1);
                }
              }
            });

            let deleteNovice = true;
            skillPlanner.currentSelectedSkills[skill].trees.forEach(function (
              tree
            ) {
              if (tree.length > 0) {
                deleteNovice = false;
              }
            });
            if (deleteNovice) {
              delete skillPlanner.currentSelectedSkills[skill];
              skillPlanner.remainingSkillPoints +=
                skillPlanner.skillData.skills[skill].novice.skillpoint_cost;
              skillPlanner.mappedCurrentSkillNames.splice(
                skillPlanner.mappedCurrentSkillNames.indexOf(
                  skillPlanner.skillData.skills[skill].novice.name
                ),
                1
              );
            }
          }
        }
      });
    }
  }
};

SkillPlanner.prototype.addHoverEventForProfessionTooltip = function () {
  const skillPlanner = this;
  // let professionSkillBoxes = document.getElementsByClassName(
  //   "professionSkillBox"
  // );

  skillPlanner.noviceSkillBox.addEventListener("mouseenter", function () {
    let skillBoxName = skillPlanner.noviceSkillBox.dataset.skillName;
    let baseSkillName = skillPlanner.noviceSkillBox.dataset.baseSkillName;
    let toolTip = document.createElement("span");
    toolTip.classList.add("tooltiptext");
    toolTip.appendChild(
      document.createTextNode(
        skillPlanner.skillData.skill_descriptions[skillBoxName]
      )
    );
    let mods = skillPlanner.skillData.skills[baseSkillName].novice.mods;
    let skillPoints =
      skillPlanner.skillData.skills[baseSkillName].novice.skillpoint_cost;

    if (mods != undefined) {
      toolTip.innerHTML += "<br><br><b>MODS:</b> <br>";
      for (const mod in mods) {
        if (skillPlanner.skillData.stat_names[mod] != undefined) {
          toolTip.innerHTML +=
            skillPlanner.skillData.stat_names[mod] + ": " + mods[mod] + "<br> ";
        }
      }
    }

    //Skill points
    toolTip.innerHTML +=
      "<br>" +
      "<br>" +
      "This skill requires " +
      skillPoints +
      " Skill Points to Learn.";

    if (
      skillPlanner.skillData.exp_names[
        skillPlanner.skillData.skills[baseSkillName].novice.xp_type
      ] != undefined
    ) {
      toolTip.innerHTML +=
        "<br>" +
        "This skill requires " +
        skillPlanner.skillData.skills[baseSkillName].novice.xp_cost +
        " of <b><i>" +
        skillPlanner.skillData.exp_names[
          skillPlanner.skillData.skills[baseSkillName].novice.xp_type
        ] +
        "</i></b> Experience";
    }

    skillPlanner.noviceSkillBox.appendChild(toolTip);
  });

  skillPlanner.noviceSkillBox.addEventListener("mouseleave", function () {
    let tooltips = document.getElementsByClassName("tooltiptext");
    for (let i = 0; i < tooltips.length; i++) {
      tooltips[i].remove();
    }
  });

  skillPlanner.masterSkillBox.addEventListener("mouseleave", function () {
    let tooltips = document.getElementsByClassName("tooltiptext");
    for (let i = 0; i < tooltips.length; i++) {
      tooltips[i].remove();
    }
  });

  skillPlanner.masterSkillBox.addEventListener("mouseenter", function () {
    let skillBoxName = skillPlanner.masterSkillBox.dataset.skillName;
    let baseSkillName = skillPlanner.masterSkillBox.dataset.baseSkillName;
    let toolTip = document.createElement("span");
    toolTip.classList.add("tooltiptext");
    toolTip.appendChild(
      document.createTextNode(
        skillPlanner.skillData.skill_descriptions[skillBoxName]
      )
    );
    let mods = skillPlanner.skillData.skills[baseSkillName].master.mods;
    let skillPoints =
      skillPlanner.skillData.skills[baseSkillName].master.skillpoint_cost;

    if (mods != undefined) {
      toolTip.innerHTML += "<br><br><b>MODS:</b> <br>";
      for (const mod in mods) {
        if (skillPlanner.skillData.stat_names[mod] != undefined) {
          toolTip.innerHTML +=
            skillPlanner.skillData.stat_names[mod] + ": " + mods[mod] + "<br> ";
        }
      }
    }

    //Skill points
    toolTip.innerHTML +=
      "<br>" +
      "<br>" +
      "This skill requires " +
      skillPoints +
      " Skill Points to Learn.";

    if (
      skillPlanner.skillData.exp_names[
        skillPlanner.skillData.skills[baseSkillName].master.xp_type
      ] != undefined
    ) {
      toolTip.innerHTML +=
        "<br>" +
        "This skill requires " +
        skillPlanner.skillData.skills[baseSkillName].master.xp_cost +
        " of <b><i>" +
        skillPlanner.skillData.exp_names[
          skillPlanner.skillData.skills[baseSkillName].master.xp_type
        ] +
        "</i></b> Experience";
    }
    skillPlanner.masterSkillBox.appendChild(toolTip);
  });

  Array.from(skillPlanner.skillTreeBoxes).forEach(function (skillBox) {
    skillBox.addEventListener("mouseenter", function () {
      let skillBoxName = skillBox.dataset.skillName;
      let baseSkillName = skillBox.dataset.baseSkillName;
      let toolTip = document.createElement("span");
      toolTip.classList.add("tooltiptext");
      toolTip.appendChild(
        document.createTextNode(
          skillPlanner.skillData.skill_descriptions[skillBoxName]
        )
      );

      //Grab the the correct skill box description, mods, and skill point costs.
      let mods;
      let skillPoints;
      let skillTrees = skillPlanner.skillData.skills[baseSkillName].trees;
      let xpCost;
      let xpName;
      for (let i = 0; i < skillTrees.length; i++) {
        for (let j = 0; j < skillTrees[i].length; j++) {
          if (skillTrees[i][j].name == skillBoxName) {
            mods = skillTrees[i][j].mods;
            skillPoints = skillTrees[i][j].skillpoint_cost;
            xpCost = skillTrees[i][j].xp_cost;
            xpName = skillPlanner.skillData.exp_names[skillTrees[i][j].xp_type];
            break;
          }
          if (mods != undefined) {
            break;
          }
        }
      }
      // }

      //Add mods if any
      if (mods != undefined) {
        toolTip.innerHTML += "<br><br><b>MODS:</b> <br>";
        for (const mod in mods) {
          if (skillPlanner.skillData.stat_names[mod] != undefined) {
            toolTip.innerHTML +=
              skillPlanner.skillData.stat_names[mod] +
              ": " +
              mods[mod] +
              "<br> ";
          }
        }
      }

      //Skill points
      toolTip.innerHTML +=
        "<br>" +
        "<br>" +
        "This skill requires " +
        skillPoints +
        " Skill Points to Learn.";

      if (xpName != undefined) {
        toolTip.innerHTML +=
          "<br>" +
          "This skill requires " +
          xpCost +
          " of <b><i>" +
          xpName +
          "</i></b> Experience";
      }
      skillBox.appendChild(toolTip);
    });

    skillBox.addEventListener("mouseleave", function () {
      let tooltips = document.getElementsByClassName("tooltiptext");
      for (let i = 0; i < tooltips.length; i++) {
        tooltips[i].remove();
      }
    });
  });
};

SkillPlanner.prototype.updateSkillPlannerDOM = function () {
  let skillPlanner = this;
  let noviceSkillBox = skillPlanner.noviceSkillBox;
  let masterSkillBox = skillPlanner.masterSkillBox;
  let baseSkill = noviceSkillBox.dataset.baseSkillName;
  let currentSelectedSkills = skillPlanner.currentSelectedSkills[baseSkill];

  if (currentSelectedSkills != undefined) {
    noviceSkillBox.classList.add("active");

    Array.from(skillPlanner.skillTreeBoxes).forEach(function (skillBox) {
      let rowIndex = parseInt(skillBox.dataset.row);
      let colIndex = parseInt(skillBox.dataset.col);

      if (currentSelectedSkills.trees[colIndex][rowIndex] != undefined) {
        skillBox.classList.add("active");
      } else {
        skillBox.classList.remove("active");
      }
    });

    if (currentSelectedSkills.master.name != undefined) {
      masterSkillBox.classList.add("active");
    } else {
      masterSkillBox.classList.remove("active");
    }
  } else {
    noviceSkillBox.classList.remove("active");
    masterSkillBox.classList.remove("active");
    Array.from(skillPlanner.skillTreeBoxes).forEach(function (skillBox) {
      skillBox.classList.remove("active");
    });
  }

  //Remove before class on list items profession list
  let professionListItems = document.getElementsByClassName(
    "professionListItem"
  );

  Array.from(professionListItems).forEach(function (professionListItem) {
    professionListItem.classList.remove("selectedProfession");
  });

  //Update the selected Professions boxes on top
  let selectedProfessionBoxContainer = document.getElementsByClassName(
    "selectProfessions"
  )[0];

  selectedProfessionBoxContainer.innerHTML = "";

  // let mods = skillPlanner.mods;
  // let experienceNeeded = skillPlanner.experienceRequired;

  skillPlanner.mods = {};
  skillPlanner.experienceRequired = {};

  for (const skill in skillPlanner.currentSelectedSkills) {
    let professionBox = document.createElement("div");
    professionBox.classList.add("selectedProfessionBox");
    professionBox.appendChild(
      document.createTextNode(skillPlanner.skillData.skill_names[skill])
    );
    professionBox.dataset.skillName = skill;
    professionBox.addEventListener(
      "click",
      skillPlanner.clickProfessionListItem.bind(skillPlanner)
    );

    let cancelProfessionBoxDiv = document.createElement("div");
    cancelProfessionBoxDiv.classList.add("cancelSelectedProfessionBox");
    cancelProfessionBoxDiv.appendChild(document.createTextNode("X"));
    cancelProfessionBoxDiv.dataset.baseSkillName = skill;
    cancelProfessionBoxDiv.addEventListener(
      "click",
      cancelProfessionTopSkillBoxClickEvent
    );
    professionBox.appendChild(cancelProfessionBoxDiv);

    selectedProfessionBoxContainer.appendChild(professionBox);

    //Add profession list item selected indicator
    document
      .querySelector('li[data-skill-name="' + skill + '"]')
      .classList.add("selectedProfession");

    //Get Skill mods - TODO: This should be moved/refractored
    for (const mod in skillPlanner.currentSelectedSkills[skill].novice.mods) {
      let modValue = skillPlanner.currentSelectedSkills[skill].novice.mods[mod];
      if (skillPlanner.mods[mod] == undefined) {
        skillPlanner.mods[mod] = parseInt(modValue);
      } else {
        skillPlanner.mods[mod] += parseInt(modValue);
      }
    }

    if (skillPlanner.currentSelectedSkills[skill].master.name != undefined) {
      for (const mod in skillPlanner.currentSelectedSkills[skill].master.mods) {
        let modValue =
          skillPlanner.currentSelectedSkills[skill].master.mods[mod];
        if (skillPlanner.mods[mod] == undefined) {
          skillPlanner.mods[mod] = parseInt(modValue);
        } else {
          skillPlanner.mods[mod] += parseInt(modValue);
        }
      }
    }

    for (
      let i = 0;
      i < skillPlanner.currentSelectedSkills[skill].trees.length;
      i++
    ) {
      for (
        let j = 0;
        j < skillPlanner.currentSelectedSkills[skill].trees[i].length;
        j++
      ) {
        for (const mod in skillPlanner.currentSelectedSkills[skill].trees[i][j]
          .mods) {
          if (
            skillPlanner.currentSelectedSkills[skill].trees[i][j].mods != null
          ) {
            let modValue =
              skillPlanner.currentSelectedSkills[skill].trees[i][j].mods[mod];
            if (skillPlanner.mods[mod] == undefined) {
              skillPlanner.mods[mod] = parseInt(modValue);
            } else {
              skillPlanner.mods[mod] += parseInt(modValue);
            }
          }
        }
      }
    }

    //Get Experience Required
    let xpNoviceCost = skillPlanner.currentSelectedSkills[skill].novice.xp_cost;
    let xpNoviceType = skillPlanner.currentSelectedSkills[skill].novice.xp_type;

    if (xpNoviceCost > 0) {
      if (skillPlanner.experienceRequired[xpNoviceType] == undefined) {
        skillPlanner.experienceRequired[xpNoviceType] = parseInt(xpNoviceCost);
      } else {
        skillPlanner.experienceRequired[xpNoviceType] += parseInt(xpNoviceCost);
      }
    }

    let xpMasterCost = skillPlanner.currentSelectedSkills[skill].novice.xp_cost;
    let xpMasterType = skillPlanner.currentSelectedSkills[skill].novice.xp_type;

    if (xpMasterCost > 0) {
      if (skillPlanner.experienceRequired[xpMasterType] == undefined) {
        skillPlanner.experienceRequired[xpMasterType] = parseInt(xpMasterCost);
      } else {
        skillPlanner.experienceRequired[xpMasterType] += parseInt(xpMasterCost);
      }
    }

    for (
      let i = 0;
      i < skillPlanner.currentSelectedSkills[skill].trees.length;
      i++
    ) {
      for (
        let j = 0;
        j < skillPlanner.currentSelectedSkills[skill].trees[i].length;
        j++
      ) {
        let xpCost =
          skillPlanner.currentSelectedSkills[skill].trees[i][j].xp_cost;
        let xpType =
          skillPlanner.currentSelectedSkills[skill].trees[i][j].xp_type;
        if (skillPlanner.experienceRequired[xpType] == undefined) {
          skillPlanner.experienceRequired[xpType] = parseInt(xpCost);
        } else {
          skillPlanner.experienceRequired[xpType] += parseInt(xpCost);
        }
      }
    }
  }

  let tableModsBody = document.getElementById("tableSkillMods").tBodies[0];
  tableModsBody.innerHTML = "";

  let rows = [];
  for (const mod in skillPlanner.mods) {
    rows.push({
      mod: mod,
      value: skillPlanner.mods[mod],
    });
  }

  rows.sort(function (a, b) {
    if (
      skillPlanner.skillData.stat_names[a.mod] >
      skillPlanner.skillData.stat_names[b.mod]
    ) {
      return 1;
    } else if (
      skillPlanner.skillData.stat_names[a.mod] <
      skillPlanner.skillData.stat_names[b.mod]
    ) {
      return -1;
    } else {
      return 0;
    }
  });

  for (let i = 0; i < rows.length; i++) {
    let row = document.createElement("tr");
    let modNameCell = document.createElement("td");
    let modValueCell = document.createElement("td");
    let modName =
      skillPlanner.skillData.stat_names[rows[i].mod] == undefined
        ? rows[i].mod
        : skillPlanner.skillData.stat_names[rows[i].mod];

    modNameCell.appendChild(document.createTextNode(modName));
    row.appendChild(modNameCell);

    modValueCell.appendChild(document.createTextNode(rows[i].value));
    row.appendChild(modValueCell);

    tableModsBody.appendChild(row);
  }

  let tableXPBody = document.getElementById("tableExperienceRequired")
    .tBodies[0];
  tableXPBody.innerHTML = "";

  rows = [];

  for (const xpType in skillPlanner.experienceRequired) {
    rows.push({
      xpType: xpType,
      value: skillPlanner.experienceRequired[xpType],
    });
  }

  rows.sort(function (a, b) {
    if (
      skillPlanner.skillData.exp_names[a.xpType] >
      skillPlanner.skillData.exp_names[b.xpType]
    ) {
      return 1;
    } else if (
      skillPlanner.skillData.exp_names[a.xpType] <
      skillPlanner.skillData.exp_names[b.xpType]
    ) {
      return -1;
    } else {
      return 0;
    }
  });

  for (let i = 0; i < rows.length; i++) {
    let row = document.createElement("tr");
    let xpNameCell = document.createElement("td");
    let xpValueCell = document.createElement("td");
    let xpName =
      skillPlanner.skillData.exp_names[rows[i].xpType] == undefined
        ? xpType
        : skillPlanner.skillData.exp_names[rows[i].xpType];

    xpNameCell.appendChild(document.createTextNode(xpName));
    row.appendChild(xpNameCell);

    xpValueCell.appendChild(document.createTextNode(rows[i].value));
    row.appendChild(xpValueCell);

    tableXPBody.appendChild(row);
  }

  let skillPointsBar = document.getElementById("skillPointsBar");
  let skillPointsNumbers = document.getElementById("skillPointsNumbers");
  let skillPointsPercentage = parseInt(
    (skillPlanner.remainingSkillPoints / skillPlanner.skillPoints) * 100
  );

  skillPointsNumbers.textContent =
    skillPlanner.remainingSkillPoints + "/" + skillPlanner.skillPoints;
  skillPointsBar.style.width = skillPointsPercentage + "%";

  function cancelProfessionTopSkillBoxClickEvent() {
    let baseSkill = this.dataset.baseSkillName;
    let noviceSkillPointCost =
      skillPlanner.currentSelectedSkills[baseSkill].novice.skillpoint_cost;

    skillPlanner.removeEliteSkills(baseSkill);

    skillPlanner.remainingSkillPoints += noviceSkillPointCost;
    skillPlanner.mappedCurrentSkillNames.splice(
      skillPlanner.mappedCurrentSkillNames.indexOf(
        skillPlanner.skillData.skills[baseSkill].novice.name
      ),
      1
    );

    skillPlanner.currentSelectedSkills[baseSkill].trees.forEach(function (
      tree
    ) {
      tree.forEach(function (skill) {
        if (skillPlanner.mappedCurrentSkillNames.includes(skill.name)) {
          skillPlanner.mappedCurrentSkillNames.splice(
            skillPlanner.mappedCurrentSkillNames.indexOf(skill.name),
            1
          );
          skillPlanner.remainingSkillPoints += skill.skillpoint_cost;
        }
      });
    });

    if (
      skillPlanner.mappedCurrentSkillNames.includes(
        skillPlanner.skillData.skills[baseSkill].master.name
      )
    ) {
      skillPlanner.mappedCurrentSkillNames.splice(
        skillPlanner.mappedCurrentSkillNames.indexOf(
          skillPlanner.skillData.skills[baseSkill].master.name
        ),
        1
      );

      skillPlanner.remainingSkillPoints +=
        skillPlanner.skillData.skills[baseSkill].master.skillpoint_cost;
    }

    delete skillPlanner.currentSelectedSkills[baseSkill];

    skillPlanner.updateSkillPlannerDOM();
  }
};

SkillPlanner.prototype.resetPlanner = function (e) {
  let skillPlanner = this;
  skillPlanner.currentSelectedSkills = {};
  skillPlanner.remainingSkillPoints = 250;
  skillPlanner.mappedCurrentSkillNames = [];
  skillPlanner.updateSkillPlannerDOM();
};
