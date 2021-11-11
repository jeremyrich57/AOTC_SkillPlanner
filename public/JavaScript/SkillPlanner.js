const xhr = new XMLHttpRequest();
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
  //console.log("onload skillPlanner data: ", skillPlannerData);
  const sortArrowAscending = String.fromCharCode(9650);
  const sortArrowDescending = String.fromCharCode(9660);
  const USER_THEMES_LOCAL_STORAGE = "aotc_userThemes";
  const CURRENT_THEME_NAME_LOCAL_STORAGE = "aotc_currentThemeName";

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
        shareURL: "",
        showCopyToast: false,
        copyClipboardMessage: "URL Copied to Clipboard!",
        showThemeCreation: false,
        currentTheme: {},
        newTheme: {},
        updateTheme: false, //This is watched so UI knows to update colors when theme is changed or in process of editing new theme
        //theme colors have underscores so they can be replaced later with dashes to update CSS variables later
        themes: [
          {
            name: "Classic",
            value: "classic",
            colors: {
              __main_bg_color: "#00404c",
              __planner_main_color: "#048da7",
              __planner_border_color: "#a5fbfb",
              __text_color: "#a5fbfb",
              __skillbox_default_color: "#006074",
              __skillbox_active_color: "#02ab2e",
              __skillbox_highlight_color: "#26672a",
            },
            update: true,
          },
          {
            name: "Dark Jedi",
            value: "dark",
            colors: {
              __main_bg_color: "#2B2B2B",
              __planner_main_color: "#1A1A1A",
              __planner_border_color: "#990000",
              __text_color: "#FF0000",
              __skillbox_default_color: "#454545",
              __skillbox_active_color: "#EDEDED",
              __skillbox_highlight_color: "#EDEDED",
            },
            update: true,
          },
          {
            name: "Light Jedi",
            value: "light",
            colors: {
              __main_bg_color: "#8A8A8A",
              __planner_main_color: "#FFFFFF",
              __planner_border_color: "#FFD700",
              __text_color: "#404040",
              __skillbox_default_color: "#DEDEDE",
              __skillbox_active_color: "#FFD700",
              __skillbox_highlight_color: "#FFEE90",
            },
            update: true,
          },
          {
            name: "Windu Purple",
            value: "windu",
            colors: {
              __main_bg_color: "#20153a",
              __planner_main_color: "#452d78",
              __planner_border_color: "#b678fc",
              __text_color: "#ebc6ff",
              __skillbox_default_color: "#5d3bb7",
              __skillbox_active_color: "#98c541",
              __skillbox_highlight_color: "#528c20",
            },
            update: true,
          },
        ],
        themeIndex: 0,
        userThemes: [],
        newUserThemeName: "",
        showThemeNameToast: false,
        showDeleteThemeToast: false,
        validThemeIndex: 0, //Used to track valid theme indexes when user selects Add New and can revert back after closing
        undoSkillsStack: [], //TODO: add undo/redo functionality
        redoSkillsStack: [],
        feedbackSelectType: "Feedback",
        feedbackInputSubject: "",
        feedbackTextareaFeedback: "",
        sendFeedback: false,
        feedbackFormPositions: {
          clientX: undefined,
          clientY: undefined,
          movementX: 0,
          movementY: 0,
        },
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

        if (professionSkills.join(",") != "") {
          history.replaceState({}, "", "?skills=" + professionSkills.join(","));
        } else {
          history.replaceState({}, "", "?");
        }

        if (this.currentSelectedSkills.length > 0 && this.shareURL != "") {
          this.shareURL = window.location.href;
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
        skillPlannerVM.shareURL = "";
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

        // skillPlannerVM.undoSkillsStack.push([
        //   ...skillPlannerVM.currentSelectedSkills,
        // ]);
        // skillPlannerVM.redoSkillsStack = [];
      },
      clickShareBuild() {
        if (skillPlannerVM.currentSelectedSkills.length > 0) {
          this.shareURL = window.location.href;
          navigator.clipboard.writeText(skillPlannerVM.shareURL).then(
            function () {
              //clipboard successfully set
              skillPlannerVM.copyClipboardMessage = "URL Copied to Clipboard!";
              skillPlannerVM.showCopyToast = true;
              setTimeout(() => (skillPlannerVM.showCopyToast = false), 3000);
            },
            function () {
              console.log(
                "Clipboard copy not supported. Please copy manually."
              );
              skillPlannerVM.showCopyToast = true;
              skillPlannerVM.copyClipboardMessage =
                "Clipboard copy not supported. Please copy manually.";
              setTimeout(() => (skillPlannerVM.showCopyToast = false), 3000);
            }
          );
        } else {
          skillPlannerVM.shareURL = "";
          skillPlannerVM.copyClipboardMessage =
            "Please select skills before copying.";
          skillPlannerVM.showCopyToast = true;
          setTimeout(() => (skillPlannerVM.showCopyToast = false), 3000);
        }
      },
      onthemechange(event) {
        let themeIndex = -1;
        if (event.target.value == "addtheme") {
          this.clickCreateTheme();
        } else {
          if (Number.isInteger(event.target.value * 1)) {
            themeIndex = event.target.value;
            this.validThemeIndex = themeIndex;
          } else {
            themeIndex = this.themes.findIndex(
              (x) => x.name == event.target.value
            );
          }

          if (this.themes[themeIndex] != undefined) {
            this.themeIndex = themeIndex;
            this.currentTheme = this.themes[themeIndex];
            this.updateTheme = !this.updateTheme;
          }
        }
      },
      clickCreateTheme() {
        this.showThemeCreation = !this.showThemeCreation;
        this.newUserThemeName = "";

        let newTheme = {
          name: "temp",
          value: "temp",
          colors: {},
        };

        let currentValidThemeIndex = 0;
        if (this.themeIndex != this.validThemeIndex) {
          currentValidThemeIndex = this.validThemeIndex;
        }

        for (const color in this.themes[currentValidThemeIndex].colors) {
          newTheme.colors[color] =
            this.themes[currentValidThemeIndex].colors[color];
        }

        this.newTheme = newTheme;
      },
      clickCancelTheme() {
        this.showThemeCreation = false;

        if (this.themeIndex != this.validThemeIndex) {
          this.themeIndex = this.validThemeIndex;
        }
        this.currentTheme = this.themes[this.themeIndex];
        this.updateTheme = !this.updateTheme;
      },
      clickApplyTheme() {
        if (this.newUserThemeName != "") {
          this.newTheme.name = this.newUserThemeName;
          this.newTheme.value = this.newUserThemeName;

          if (this.themes.find((x) => x.name == this.newTheme.name)) {
            let updateThemeIndex = this.themes.findIndex(
              (x) => x.name == this.newTheme.name
            );
            this.themes[updateThemeIndex] = this.newTheme;
            this.themeIndex = updateThemeIndex;

            updateThemeIndex = this.userThemes.findIndex(
              (x) => x.name == this.newTheme.name
            );

            if (updateThemeIndex >= 0) {
              this.userThemes[updateThemeIndex] = this.newTheme;
            }
          } else {
            this.themes.push(this.newTheme);
            this.themeIndex = this.themes.length - 1;
            this.userThemes.push(this.newTheme);
          }

          localStorage.setItem(
            USER_THEMES_LOCAL_STORAGE,
            JSON.stringify(this.userThemes)
          );

          localStorage.setItem(
            CURRENT_THEME_NAME_LOCAL_STORAGE,
            this.currentTheme.name
          );

          this.showThemeCreation = false;
          this.newUserThemeName = "";
        } else {
          this.showThemeNameToast = true;
          setTimeout(() => (skillPlannerVM.showThemeNameToast = false), 3000);
        }
      },
      themeColorChange(event, key) {
        let newColor = event.target.value;
        this.newTheme.colors[key] = newColor;
        this.currentTheme = this.newTheme;
        this.updateTheme = !this.updateTheme;
      },
      deleteTheme() {
        let themeName = this.newUserThemeName;
        this.themes = this.themes.filter((x) => x.name != themeName);
        this.userThemes = this.userThemes.filter((x) => x.name != themeName);
        this.themeIndex = 0;
        this.currentTheme = this.themes[this.themeIndex];
        this.updateTheme = !this.updateTheme;
        this.validThemeIndex = this.themeIndex;
        this.showDeleteThemeToast = true;
        setTimeout(() => (skillPlannerVM.showDeleteThemeToast = false), 3000);

        localStorage.setItem(
          USER_THEMES_LOCAL_STORAGE,
          JSON.stringify(this.userThemes)
        );
      },
      onThemeInputChange(e) {
        let themeName = e.target.value;
        let themeIndex = this.themes.findIndex((x) => x.name == themeName);

        if (themeIndex >= 0) {
          this.validThemeIndex = themeIndex;
          this.currentTheme = this.themes[themeIndex];
          this.updateTheme = !this.updateTheme;
        }
      },
      clickSubmitFeedback() {
        const params = {
          type: skillPlannerVM.feedbackSelectType,
          subject: skillPlannerVM.feedbackInputSubject,
          feedback: skillPlannerVM.feedbackTextareaFeedback,
        };
        if (skillPlannerVM.feedbackAddTheme == undefined) {
          params.theme = "";
        } else {
          let theme = skillPlannerVM.userThemes.find(
            (x) => x.name == skillPlannerVM.feedbackAddTheme
          );
          params.theme = JSON.stringify(theme);
        }
        console.log("params", params);
        if (params.feedback == "" && params.theme == undefined) {
          alert("Please provide feedback before submitting");
          return;
        }

        const http = new XMLHttpRequest();
        http.open("POST", "/api/sendEmail");
        http.setRequestHeader("Content-type", "application/json");

        http.onload = function () {
          console.log("http", http);
          if (http.readyState == 4 && http.status == 200) {
            console.log("Send email successful");
          } else {
            console.log("Request failed.  Returned status of " + xhr.status);
          }
        };
        http.send(JSON.stringify(params));
      },
      dragMouseDown: function (event) {
        event.preventDefault();
        // get the mouse cursor position at startup:
        this.feedbackFormPositions.clientX = event.clientX;
        this.feedbackFormPositions.clientY = event.clientY;
        document.onmousemove = this.elementDrag;
        document.onmouseup = this.closeDragElement;
      },
      elementDrag: function (event) {
        event.preventDefault();
        this.feedbackFormPositions.movementX =
          this.feedbackFormPositions.clientX - event.clientX;
        this.feedbackFormPositions.movementY =
          this.feedbackFormPositions.clientY - event.clientY;
        this.feedbackFormPositions.clientX = event.clientX;
        this.feedbackFormPositions.clientY = event.clientY;
        // set the element's new position:
        this.$refs.feedbackForm.style.top =
          this.$refs.feedbackForm.offsetTop -
          this.feedbackFormPositions.movementY +
          "px";
        this.$refs.feedbackForm.style.left =
          this.$refs.feedbackForm.offsetLeft -
          this.feedbackFormPositions.movementX +
          "px";
      },
      closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
      },
    },
    watch: {
      updateTheme: function () {
        if (
          this.currentTheme != undefined &&
          this.currentTheme.colors != undefined
        ) {
          let root = document.documentElement;
          for (const property in this.currentTheme.colors) {
            let rootProperty = property.replace(/[_]/g, (m) => "-");
            root.style.setProperty(
              rootProperty,
              this.currentTheme.colors[property]
            );
          }

          localStorage.setItem(
            CURRENT_THEME_NAME_LOCAL_STORAGE,
            this.currentTheme.name
          );
        }
      },
    },
  });

  const skillPlannerVM = app.mount("#app");

  if (typeof Storage !== "undefined") {
    if (localStorage.getItem(USER_THEMES_LOCAL_STORAGE)) {
      let userThemes = JSON.parse(
        localStorage.getItem(USER_THEMES_LOCAL_STORAGE)
      );
      skillPlannerVM.userThemes = userThemes;
      skillPlannerVM.themes = skillPlannerVM.themes.concat(userThemes);
    }

    if (localStorage.getItem(CURRENT_THEME_NAME_LOCAL_STORAGE)) {
      let themeIndex = skillPlannerVM.themes.findIndex(
        (x) => x.name == localStorage.getItem(CURRENT_THEME_NAME_LOCAL_STORAGE)
      );

      if (themeIndex >= 0) {
        skillPlannerVM.currentTheme = skillPlannerVM.themes[themeIndex];
        skillPlannerVM.themeIndex = themeIndex;
        skillPlannerVM.updateTheme = !skillPlannerVM.updateTheme;
      }
    }
  }

  //Allow builds be loaded based on URL
  if (urlQueryParams.skills == undefined || urlQueryParams.skills == "") {
    let artisan = skillPlannerVM.getProfessionByName("crafting_artisan");
    skillPlannerVM.clickProfession(artisan);
  } else {
    try {
      let urlSkills = urlQueryParams.skills.split(",");
      let startingProfession;
      urlSkills.some(function (skillString) {
        let skillStringSkills = skillString.split(":");
        let professionName = skillStringSkills[0];

        if (
          professionName.split("_")[professionName.split("_").length - 1] ==
          "master"
        ) {
          skillPlannerVM.clickSkillBox(professionName);
        } else {
          let profession = skillPlannerVM.getProfessionByName(professionName);

          if (startingProfession == undefined) {
            startingProfession = profession;
          }

          let noviceProfessionName = profession.novice;
          skillPlannerVM.clickSkillBox(noviceProfessionName);

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
    } catch (e) {
      console.warn(
        "URL provided is not a valid build sequence. Please use the one provided by either copying the URL manually or clicking Share Build button."
      );

      let artisan = skillPlannerVM.getProfessionByName("crafting_artisan");
      skillPlannerVM.clickProfession(artisan);
    }
  }

  document.addEventListener("keydown", handleKeypress);

  function handleKeypress(e) {
    if (e.key === "Escape") {
      if (skillPlannerVM.sendFeedback) {
        skillPlannerVM.sendFeedback = false;
      } else if (
        skillPlannerVM.showThemeCreation != undefined &&
        skillPlannerVM.showThemeCreation
      ) {
        skillPlannerVM.clickCancelTheme();
      }
    } else if (e.key == "z" && e.ctrlKey) {
      // if (skillPlannerVM.undoSkillsStack.length) {
      //   let latestSkills;
      //   if (skillPlannerVM.redoSkillsStack.length == 0) {
      //     latestSkills = skillPlannerVM.undoSkillsStack.pop();
      //     skillPlannerVM.redoSkillsStack.push(latestSkills);
      //   }
      //   latestSkills = skillPlannerVM.undoSkillsStack.pop();
      //   skillPlannerVM.redoSkillsStack.push(latestSkills);
      //   skillPlannerVM.currentSelectedSkills = latestSkills;
      //   console.log(
      //     "skillPlannerVM.redoSkillsStack undo",
      //     skillPlannerVM.redoSkillsStack
      //   );
      // }
    } else if (e.key == "y" && e.ctrlKey) {
      // console.log(
      //   "skillPlannerVM.redoSkillsStack",
      //   skillPlannerVM.redoSkillsStack
      // );
      // if (skillPlannerVM.redoSkillsStack.length) {
      //   let latestSkills = skillPlannerVM.redoSkillsStack.shift();
      //   console.log("latestSkills", latestSkills);
      //   skillPlannerVM.currentSelectedSkills = latestSkills;
      // }
    }
  }
}
