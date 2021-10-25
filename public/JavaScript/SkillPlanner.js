var xhr = new XMLHttpRequest();
xhr.open("GET", "/api/getSkillData");
xhr.onload = function () {
  if (xhr.status === 200) {
    const data = JSON.parse(xhr.response);
    // const skillPlanner = new SkillPlanner(data.SKILL_DATA);
    SkillPlanner(data.skillPlannerData);
  } else {
    console.log("Request failed.  Returned status of " + xhr.status);
  }
};
xhr.send();

function SkillPlanner(skillPlannerData) {
  console.log("onload skillPlanner data: ", skillPlannerData);
  // const skillPlanner = this;
  const skillData = skillPlannerData.skillData;
  const skillPoints = 250;
  let remainingSkillPoints = skillPoints;
  let currentProfessionList = [];
  const urlSearchParams = new URLSearchParams(window.location.search);
  const urlQueryParams = Object.fromEntries(urlSearchParams.entries());

  console.log("urlQueryParams: ", urlQueryParams);
  renderProfessionList();

  if (urlQueryParams.skills == undefined) {
    // let artisanIndex = skillPlannerData.professionLists.basicList.findIndex(
    //   (x) => x.professionName === "crafting_artisan"
    // );
    // let artisan = skillPlannerData.professionLists.basicList[artisanIndex];
    // console.log("artisan", artisan);
    let artisan = getProfessionByName("crafting_artisan");
    clickProfession(artisan);
  }

  function renderProfessionList() {
    let ul = document.getElementById("listProfessions");
    skillPlannerData.professionLists.basicList.forEach(function (
      profession,
      index
    ) {
      let li = document.createElement("li");
      let skillDisplayName =
        skillData.skill_names[profession.professionName] == undefined
          ? profession
          : skillData.skill_names[profession.professionName];
      li.appendChild(document.createTextNode(skillDisplayName));
      li.setAttribute("data-skill-name", profession.professionName);
      li.classList.add("professionListItem");
      li.addEventListener("click", function () {
        clickProfession(profession);
      });
      ul.appendChild(li);
    });

    let hr = document.createElement("hr");
    ul.appendChild(hr);

    skillPlannerData.professionLists.eliteList.forEach(function (
      profession,
      index
    ) {
      let li = document.createElement("li");
      let skillDisplayName =
        skillData.skill_names[profession.professionName] == undefined
          ? profession
          : skillData.skill_names[profession.professionName];
      li.appendChild(document.createTextNode(skillDisplayName));
      li.setAttribute("data-skill-name", profession.professionName);
      li.classList.add("professionListItem");
      li.addEventListener("click", function () {
        clickProfession(profession);
      });
      ul.appendChild(li);
    });

    hr = document.createElement("hr");
    ul.appendChild(hr);

    skillPlannerData.professionLists.jediList.forEach(function (
      profession,
      index
    ) {
      let li = document.createElement("li");
      let skillDisplayName =
        skillData.skill_names[profession.professionName] == undefined
          ? profession
          : skillData.skill_names[profession.professionName];
      li.appendChild(document.createTextNode(skillDisplayName));
      li.setAttribute("data-skill-name", profession.professionName);
      li.classList.add("professionListItem");
      li.addEventListener("click", function () {
        clickProfession(profession);
      });
      ul.appendChild(li);
    });

    hr = document.createElement("hr");
    ul.appendChild(hr);

    skillPlannerData.professionLists.forceList.forEach(function (
      profession,
      index
    ) {
      let li = document.createElement("li");
      let skillDisplayName =
        skillData.skill_names[profession.professionName] == undefined
          ? profession
          : skillData.skill_names[profession.professionName];
      li.appendChild(document.createTextNode(skillDisplayName));
      li.setAttribute("data-skill-name", profession.professionName);
      li.classList.add("professionListItem");
      li.addEventListener("click", function () {
        clickProfession(profession);
      });
      ul.appendChild(li);
    });
  }

  function clickProfession(profession) {
    let professionName = profession.professionName;
    let noviceSkillBox = document.getElementById("noviceSkillBox");
    let masterSkillBox = document.getElementById("masterSkillBox");
    let skillTreeBoxes = document.querySelectorAll(".professionSkillBox");
    let listItem = document.querySelector(
      "[data-skill-name='" + professionName + "']"
    );

    noviceSkillBox.removeEventListener("mouseenter", tooltipEnter, true);
    masterSkillBox.removeEventListener("mouseenter", tooltipEnter, true);
    skillTreeBoxes.forEach((x) =>
      x.removeEventListener("mouseenter", tooltipEnter, true)
    );

    document.getElementById("skillName").innerText =
      skillData.skill_names[professionName];

    document
      .querySelectorAll(".activeProfession")
      .forEach((x) => x.classList.remove("activeProfession"));

    listItem.classList.add("activeProfession");

    noviceSkillBox.innerText = skillData.skill_names[profession.novice];
    masterSkillBox.innerText = skillData.skill_names[profession.master];

    //Add novice and master tooltip here
    //bind to named function so it can be removed on each profession click call
    noviceSkillBox.addEventListener(
      "mouseenter",
      tooltipEnter.bind(this, noviceSkillBox, profession.novice)
    );

    noviceSkillBox.addEventListener("mouseleave", function tooltipExit() {
      document.querySelectorAll(".tooltiptext").forEach((x) => x.remove());
    });

    masterSkillBox.addEventListener(
      "mouseenter",
      tooltipEnter.bind(this, masterSkillBox, profession.master)
    );

    masterSkillBox.addEventListener("mouseleave", function tooltipExit() {
      document.querySelectorAll(".tooltiptext").forEach((x) => x.remove());
    });

    let masterSkillLinks = document.getElementById("topMasterEliteSkillsText");
    masterSkillLinks.innerHTML = "";

    if (
      skillPlannerData.professionLists.eliteProfessionMap[profession.master] !=
      undefined
    ) {
      skillPlannerData.professionLists.eliteProfessionMap[
        profession.master
      ].forEach(function (skill) {
        let span = document.createElement("span");
        span.appendChild(document.createTextNode(skillData.skill_names[skill]));
        span.addEventListener("click", function () {
          let profession = getProfessionByName(skill);
          clickProfession(profession);
        });
        masterSkillLinks.appendChild(span);
      });
    }

    let noviceSkillLinks = document.getElementById("prerequesitSkillsText");
    noviceSkillLinks.innerHTML = "";

    if (
      skillPlannerData.professionLists.novicePrereqProfessionMap[
        professionName
      ] != undefined
    ) {
      skillPlannerData.professionLists.novicePrereqProfessionMap[
        professionName
      ].forEach(function (skill) {
        let span = document.createElement("span");
        span.appendChild(document.createTextNode(skillData.skill_names[skill]));
        span.addEventListener("click", function () {
          let profession = getProfessionByName(skill);
          clickProfession(profession);
        });
        noviceSkillLinks.appendChild(span);
      });
    }

    document
      .querySelectorAll("div.eliteSkillsText")
      .forEach((x) => (x.innerHTML = ""));

    skillTreeBoxes.forEach(function (skillBox) {
      let rowIndex = skillBox.getAttribute("data-row");
      let colIndex = skillBox.getAttribute("data-col");
      let skillBoxName = profession.skillTrees[colIndex][rowIndex];
      skillBox.innerText = skillData.skill_names[skillBoxName];

      //Add elite links here
      if (
        rowIndex == 3 &&
        skillPlannerData.professionLists.eliteProfessionMap[skillBoxName] !=
          undefined
      ) {
        let eliteSkillsLinks = document.querySelector(
          "div.eliteSkillsText[data-elite-col='" + colIndex + "']"
        );
        eliteSkillsLinks.innerHTML = "";
        skillPlannerData.professionLists.eliteProfessionMap[
          skillBoxName
        ].forEach(function (skill) {
          let span = document.createElement("span");
          span.appendChild(
            document.createTextNode(skillData.skill_names[skill])
          );
          span.addEventListener("click", function () {
            let profession = getProfessionByName(skill);
            clickProfession(profession);
          });
          eliteSkillsLinks.appendChild(span);
        });
      }

      //Add tooltip here
      skillBox.addEventListener(
        "mouseenter",
        tooltipEnter.bind(this, skillBox, skillBoxName)
      );

      skillBox.addEventListener("mouseleave", function tooltipExit() {
        document.querySelectorAll(".tooltiptext").forEach((x) => x.remove());
      });
    });

    //Named function so event listener can be removed on each profession change
    function tooltipEnter(skillBox, skillName) {
      let toolTip = addToolTip(skillName);
      skillBox.appendChild(toolTip);
    }
  }

  function getProfessionByName(professionName) {
    let profession;
    for (const list in skillPlannerData.professionLists) {
      let professionList = skillPlannerData.professionLists[list];
      let professionIndex = professionList.findIndex(
        (x) => x.professionName === professionName
      );

      if (professionIndex > -1) {
        profession = professionList[professionIndex];
        break;
      }
    }

    return profession;
  }

  function addToolTip(skillBoxName) {
    let toolTip = document.createElement("span");
    let skill = skillData.skills[skillBoxName];
    let description =
      skillData.skill_descriptions[skillBoxName] == undefined
        ? "No description available."
        : skillData.skill_descriptions[skillBoxName];
    toolTip.classList.add("tooltiptext");

    if (skillData.skill_titles[skillBoxName] != undefined) {
      toolTip.innerHTML +=
        "<span style='color:lightgreen'>(" +
        skillData.skill_titles[skillBoxName] +
        ")</span><br><br>";
    }

    toolTip.appendChild(document.createTextNode(description));

    toolTip.innerHTML += "<br><br><b>MODS:</b> <br>";
    for (const mod in skill.skill_mods) {
      if (skillData.skill_mod_names[mod] != undefined) {
        toolTip.innerHTML +=
          skillData.skill_mod_names[mod] +
          ": " +
          skill.skill_mods[mod] +
          "<br> ";
      }
    }

    if (skill.commands.length > 0) {
      toolTip.innerHTML += "<br><br><b>SKILLS:</b><br>";
      skill.commands.forEach(function (command) {
        let commandName = skillData.command_names[command.toLowerCase()];
        if (commandName != undefined) {
          toolTip.innerHTML += commandName + "<br>";
        }
      });
    }

    toolTip.innerHTML +=
      "<br>" +
      "<br>" +
      "This skill requires " +
      skill.points_required +
      " Skill Points to Learn.";
    toolTip.innerHTML +=
      "<br>" +
      "This skill requires " +
      skill.xp_cost +
      " of <b><i>" +
      skillData.exp_names[skill.xp_type] +
      "</i></b> Experience";

    return toolTip;
  }
}
