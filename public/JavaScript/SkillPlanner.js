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
            console.log(profession);
            clickProfession(profession);
          });
          eliteSkillsLinks.appendChild(span);
        });
      }
    });
  }

  function getProfessionByName(professionName) {
    console.log("professionName", professionName);
    let profession;
    for (const list in skillPlannerData.professionLists) {
      let professionList = skillPlannerData.professionLists[list];
      console.log("professionList: ", professionList);
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
}
