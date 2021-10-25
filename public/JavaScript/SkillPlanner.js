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
    let artisanIndex = skillPlannerData.professionLists.basicList.findIndex(
      (x) => x.professionName === "crafting_artisan"
    );
    let artisan = skillPlannerData.professionLists.basicList[artisanIndex];
    console.log("artisan", artisan);
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
    document.getElementById("skillName").innerText =
      skillData.skill_names[professionName];

    document
      .querySelectorAll(".activeProfession")
      .forEach((x) => x.classList.remove("activeProfession"));

    listItem.classList.add("activeProfession");

    noviceSkillBox.innerText = skillData.skill_names[profession.novice];
    masterSkillBox.innerText = skillData.skill_names[profession.master];

    let masterSkillLinks = document.getElementById("topMasterEliteSkillsText");
    masterSkillLinks.innerHTML = "";

    // if (
    //   skillData.eliteProfessionPrerequisites[profession.master] != undefined
    // ) {
    //   skillData.eliteProfessionPrerequisites[profession.master].forEach(
    //     function (eliteSkill) {
    //       let span = document.createElement("span");
    //       span.appendChild(
    //         document.createTextNode(skillData.skill_names[eliteSkill])
    //       );
    //       span.addEventListener("click", function () {
    //         clickProfession(eliteSkill);
    //       });
    //       masterSkillLinks.appendChild(span);
    //     }
    //   );
    // }

    let eliteSkillsTree1 = document.getElementById("toEliteSkills1");
    let eliteSkillsTree2 = document.getElementById("toEliteSkills2");
    let eliteSkillsTree3 = document.getElementById("toEliteSkills3");
    let eliteSkillsTree4 = document.getElementById("toEliteSkills4");
    eliteSkillsTree1.innerHTML = "";
    eliteSkillsTree2.innerHTML = "";
    eliteSkillsTree3.innerHTML = "";
    eliteSkillsTree4.innerHTML = "";

    skillTreeBoxes.forEach(function (skillBox) {
      let rowIndex = skillBox.getAttribute("data-row");
      let colIndex = skillBox.getAttribute("data-col");
      let skillBoxName = profession.skillTrees[colIndex][rowIndex];
      skillBox.innerText = skillData.skill_names[skillBoxName];

      // if (
      //   rowIndex == 3 &&
      //   skillData.eliteProfessionPrerequisites[skillBoxName] != undefined
      // ) {
      //   if (colIndex == 0) {
      //     skillData.eliteProfessionPrerequisites[skillBoxName].forEach(
      //       function (eliteSkill) {
      //         let span = document.createElement("span");
      //         span.appendChild(
      //           document.createTextNode(skillData.skill_names[eliteSkill])
      //         );
      //         span.addEventListener("click", function () {
      //           clickProfession(eliteSkill);
      //         });
      //         eliteSkillsTree1.appendChild(span);
      //       }
      //     );
      //   } else if (colIndex == 1) {
      //     skillData.eliteProfessionPrerequisites[skillBoxName].forEach(
      //       function (eliteSkill) {
      //         let span = document.createElement("span");
      //         span.appendChild(
      //           document.createTextNode(skillData.skill_names[eliteSkill])
      //         );
      //         span.addEventListener("click", function () {
      //           clickProfession(eliteSkill);
      //         });
      //         eliteSkillsTree2.appendChild(span);
      //       }
      //     );
      //   } else if (colIndex == 2) {
      //     skillData.eliteProfessionPrerequisites[skillBoxName].forEach(
      //       function (eliteSkill) {
      //         let span = document.createElement("span");
      //         span.appendChild(
      //           document.createTextNode(skillData.skill_names[eliteSkill])
      //         );
      //         span.addEventListener("click", function () {
      //           clickProfession(eliteSkill);
      //         });
      //         eliteSkillsTree3.appendChild(span);
      //       }
      //     );
      //   } else if (colIndex == 3) {
      //     skillData.eliteProfessionPrerequisites[skillBoxName].forEach(
      //       function (eliteSkill) {
      //         let span = document.createElement("span");
      //         span.appendChild(
      //           document.createTextNode(skillData.skill_names[eliteSkill])
      //         );
      //         span.addEventListener("click", function () {
      //           clickProfession(eliteSkill);
      //         });
      //         eliteSkillsTree4.appendChild(span);
      //       }
      //     );
      //   }
      // }
    });
  }
}
