var xhr = new XMLHttpRequest();
xhr.open("GET", "/api/getSkillData");
xhr.onload = function () {
  if (xhr.status === 200) {
    const data = JSON.parse(xhr.response);
    createSkillPlanner(data.skillPlannerData);
  } else {
    console.log("Request failed.  Returned status of " + xhr.status);
  }
};
xhr.send();

function createSkillPlanner(skillPlannerData) {
  const urlSearchParams = new URLSearchParams(window.location.search);
  const urlQueryParams = Object.fromEntries(urlSearchParams.entries());
  console.log("onload skillPlanner data: ", skillPlannerData);
  const sortArrowAscending = String.fromCharCode(9650);
  const sortArrowDescending = String.fromCharCode(9660);
  const app = Vue.createApp({
    data() {
      return {
        skillPlannerData: skillPlannerData,
        skillData: skillPlannerData.skillData,
        basicProfessions: skillPlannerData.professionLists.basicList,
        eliteProfessions: skillPlannerData.professionLists.eliteList,
        jediProfessions: skillPlannerData.professionLists.jediList,
        forceProfessions: skillPlannerData.professionLists.forceList,
        maxSkillPoints: 250,
        currentSelectedProfession: {},
        currentSelectedSkills: [],
        abilitiesGrantedSortDirection: true, //true ascending, false descending
        certificationSortDirection: true,
        skillModsSortDirection: true,
        experienceSortDirection: true,
        tooltipActive: false,
        showSkillTooltip: {},
      };
    },
    computed: {
      currentSelectedProfessions: function () {
        let currentSelectedProfessions = [];
        let skillData = this.skillData;

        this.currentSelectedSkills.forEach(function (skillName) {
          let skill = skillData.skills[skillName];
          if (!currentSelectedProfessions.includes(skill.professionName)) {
            currentSelectedProfessions.push(skill.professionName);
          }
        });

        let professionSkills = [];
        currentSelectedProfessions.some(function (professionName) {
          let profession = skillPlannerVM.getProfessionByName(professionName);
          if (
            skillPlannerVM.currentSelectedSkills.includes(profession.master)
          ) {
            professionSkills.push(profession.master);
          } else {
            let skillName = professionName;
            let trees = [];
            profession.skillTrees.some(function (tree, index) {
              let skillCount = 0;
              tree.some(function (skill) {
                if (skillPlannerVM.currentSelectedSkills.includes(skill)) {
                  skillCount++;
                }
              });
              trees.push(skillCount);
            });

            professionSkills.push(skillName + ":" + trees.join("-"));
          }
        });

        console.log("professionSkills", professionSkills.join(","));
        console.log("skills blank", professionSkills.join(",") == "");
        if (professionSkills.join(",") != "") {
          history.replaceState({}, "", "?skills=" + professionSkills.join(","));
        } else {
          history.replaceState({}, "", "?");
        }

        return currentSelectedProfessions;
      },
      skillPointsRemaining: function () {
        let skillPoints = this.maxSkillPoints;
        let skillData = this.skillData;

        this.currentSelectedSkills.forEach(function (skillName) {
          let skill = skillData.skills[skillName];
          skillPoints -= skill.points_required;
        });

        return skillPoints;
      },
      skillPointsBarWidth: function () {
        return (this.skillPointsRemaining / this.maxSkillPoints) * 100 + "%";
      },
      abilitiesGranted: function () {
        let abilities = [];
        let skillData = this.skillData;
        this.currentSelectedSkills.some(function (skillName) {
          let skill = skillData.skills[skillName];
          let skillAbilities = skill.commands.filter(
            (x) =>
              x.split("_")[0] != "private" &&
              x.split("_")[0] != "cert" &&
              skillData.command_names[x.toLowerCase()] != undefined &&
              !abilities.includes(x)
          );

          abilities = abilities.concat(skillAbilities);
        });

        let abilitiesGranted = abilities.map(function (ability) {
          ability = ability.toLowerCase();
          return {
            name: skillData.command_names[ability],
            description: skillData.command_descriptions[ability],
          };
        });

        if (this.abilitiesGrantedSortDirection) {
          abilitiesGranted.sort(function (a, b) {
            return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
          });
        } else {
          abilitiesGranted.sort(function (a, b) {
            return a.name > b.name ? -1 : a.name < b.name ? 1 : 0;
          });
        }

        return abilitiesGranted;
      },
      abilitiesGrantedSortDirectionArrow: function () {
        return this.abilitiesGrantedSortDirection
          ? sortArrowAscending
          : sortArrowDescending;
      },
      certificationsGranted: function () {
        let abilities = [];
        let skillData = this.skillData;
        this.currentSelectedSkills.some(function (skillName) {
          let skill = skillData.skills[skillName];
          let skillAbilities = skill.commands.filter(
            (x) =>
              x.split("_")[0] == "cert" &&
              !abilities.includes(x) &&
              skillData.command_names[x] != undefined
          );

          abilities = abilities.concat(skillAbilities);
        });
        let certifications = abilities.map(function (ability) {
          ability = ability.toLowerCase();
          return {
            name: skillData.command_names[ability],
            description: skillData.command_descriptions[ability],
          };
        });

        if (this.certificationSortDirection) {
          certifications.sort(function (a, b) {
            return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
          });
        } else {
          certifications.sort(function (a, b) {
            return a.name > b.name ? -1 : a.name < b.name ? 1 : 0;
          });
        }

        return certifications;
      },
      certificationsSortDirectionArrow: function () {
        return this.certificationSortDirection
          ? sortArrowAscending
          : sortArrowDescending;
      },
      skillMods: function () {
        let skillsMods = {};
        let skillData = this.skillData;
        this.currentSelectedSkills.some(function (skillName) {
          let skill = skillData.skills[skillName];
          for (const mod in skill.skill_mods) {
            if (skillsMods[mod] == undefined) {
              skillsMods[mod] = skill.skill_mods[mod];
            } else {
              skillsMods[mod] += skill.skill_mods[mod];
            }
          }
        });

        let skillModsList = [];
        for (const mod in skillsMods) {
          if (skillData.skill_mod_names[mod] != undefined) {
            skillModsList.push({
              name: skillData.skill_mod_names[mod],
              description: skillData.skill_mod_descriptions[mod],
              value: skillsMods[mod],
            });
          }
        }

        if (this.skillModsSortDirection) {
          skillModsList.sort(function (a, b) {
            return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
          });
        } else {
          skillModsList.sort(function (a, b) {
            return a.name > b.name ? -1 : a.name < b.name ? 1 : 0;
          });
        }

        return skillModsList;
      },
      skillModsSortDirectionArrow: function () {
        return this.skillModsSortDirection
          ? sortArrowAscending
          : sortArrowDescending;
      },
      experienceRequired: function () {
        let experienceTypes = {};
        let skillData = this.skillData;
        this.currentSelectedSkills.some(function (skillName) {
          let skill = skillData.skills[skillName];
          if (experienceTypes[skill.xp_type] == undefined) {
            experienceTypes[skill.xp_type] = skill.xp_cost;
          } else {
            experienceTypes[skill.xp_type] += skill.xp_cost;
          }
        });

        let experience = [];
        for (const xpType in experienceTypes) {
          if (skillData.exp_names[xpType] != undefined) {
            experience.push({
              name: skillData.exp_names[xpType],
              description: skillData.exp_descriptions[xpType],
              value: experienceTypes[xpType],
            });
          }
        }

        if (this.experienceSortDirection) {
          experience.sort(function (a, b) {
            return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
          });
        } else {
          experience.sort(function (a, b) {
            return a.name > b.name ? -1 : a.name < b.name ? 1 : 0;
          });
        }

        return experience;
      },
      experienceSortDirectionArrow: function () {
        return this.experienceSortDirection
          ? sortArrowAscending
          : sortArrowDescending;
      },
      computeSkillToolTips: function () {
        //This is necesary to toggle tooltip on hover for each skill
        let tooltipMap = {
          novice: false,
          master: false,
        };

        if (this.currentSelectedProfession.skillTrees != undefined) {
          this.currentSelectedProfession.skillTrees.forEach(function (tree) {
            tree.some(function (skill) {
              tooltipMap[skill] = false;
            });
          });
        }
        return tooltipMap;
      },
    },
    methods: {
      resetPlanner() {
        skillPlannerVM.currentSelectedSkills = [];
      },
      clickProfession(profession) {
        skillPlannerVM.currentSelectedProfession = profession;
      },
      getProfessionByName(professionName) {
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
      },
      clickSkillBox(skillName) {
        let skill = skillPlannerVM.skillData.skills[skillName];
        let professionName = skill.professionName;
        let profession = skillPlannerVM.getProfessionByName(professionName);
        let professionNoviceSkill =
          skillPlannerVM.skillData.skills[profession.novice];
        let precludedSkillsFound = professionNoviceSkill.preclusion_skills.some(
          (x) => skillPlannerVM.currentSelectedSkills.includes(x)
        );

        if (precludedSkillsFound) {
          return;
        }

        if (!skillPlannerVM.currentSelectedSkills.includes(skillName)) {
          let skillsToAdd = [skillName];
          let skillsIndex = 0;

          while (skill != undefined && skill.skills_required.length) {
            skill.skills_required.some(function (prereqSkillName, index) {
              if (
                !skillPlannerVM.currentSelectedSkills.includes(
                  prereqSkillName
                ) &&
                !skillsToAdd.includes(prereqSkillName)
              ) {
                skillsToAdd.push(prereqSkillName);
              }

              if (index == skill.skills_required.length - 1) {
                skillsIndex++;
                skill =
                  skillPlannerVM.skillData.skills[skillsToAdd[skillsIndex]];
              }
            });
          }
          skillsToAdd.reverse();

          skillsToAdd.some(function (skillToAddName) {
            let skillToAdd = skillPlannerVM.skillData.skills[skillToAddName];

            if (
              skillPlannerVM.skillPointsRemaining > 0 &&
              skillPlannerVM.skillPointsRemaining -
                skillToAdd.points_required >=
                0
            ) {
              skillPlannerVM.currentSelectedSkills.push(skillToAddName);
            } else {
              return true;
            }
          });
        } else {
          let skillsToRemove = [skillName];
          let skillsToRemoveIndex = 0;
          while (skill != undefined) {
            skillPlannerVM.currentSelectedSkills.some(function (
              currentSkillsName,
              index
            ) {
              let currentSkillsSkill =
                skillPlannerVM.skillData.skills[currentSkillsName];

              if (
                currentSkillsSkill.skills_required.includes(skill.name) &&
                !skillsToRemove.includes(currentSkillsName)
              ) {
                skillsToRemove.push(currentSkillsName);
              }

              if (index == skillPlannerVM.currentSelectedSkills.length - 1) {
                skillsToRemoveIndex++;
                skill =
                  skillPlannerVM.skillData.skills[
                    skillsToRemove[skillsToRemoveIndex]
                  ];
              }
            });
          }

          skillPlannerVM.currentSelectedSkills =
            skillPlannerVM.currentSelectedSkills.filter(
              (x) => !skillsToRemove.includes(x)
            );
        }
      },
    },
  });

  const skillPlannerVM = app.mount("#app");

  //Allow builds to be shared
  if (urlQueryParams.skills == undefined || urlQueryParams.skills == "") {
    let artisan = skillPlannerVM.getProfessionByName("crafting_artisan");
    skillPlannerVM.clickProfession(artisan);
  } else {
    let urlSkills = urlQueryParams.skills.split(",");
    let startingProfession;
    urlSkills.some(function (skillString) {
      let skillStringSkills = skillString.split(":");
      let professionName = skillStringSkills[0];

      if (
        professionName.split("_")[professionName.split("_").length - 1] ==
        "master"
      ) {
        let skill = skillPlannerVM.skillData.skills[professionName];

        if (startingProfession == undefined) {
          startingProfession = skillPlannerVM.getProfessionByName(
            skill.professionName
          );
        }

        skillPlannerVM.clickSkillBox(professionName);
      } else {
        let profession = skillPlannerVM.getProfessionByName(professionName);

        if (startingProfession == undefined) {
          startingProfession = profession;
        }

        let treeSkillNumbers = skillStringSkills[1].split("-");
        treeSkillNumbers.some(function (skillNumber, index) {
          skillNumber = skillNumber * 1;
          if (skillNumber > 0) {
            let skillName = profession.skillTrees[index][skillNumber - 1];
            skillPlannerVM.clickSkillBox(skillName);
          }
        });
      }
    });

    skillPlannerVM.clickProfession(startingProfession);
  }
}
