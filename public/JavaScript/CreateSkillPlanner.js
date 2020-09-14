import { skillPlanner } from "./public/JavaScript/SkillPlanner.js";

var xhr = new XMLHttpRequest();
xhr.open("GET", "/api/getSkillData");
xhr.onload = function () {
  if (xhr.status === 200) {
    console.log("xhr", xhr);
    console.log("Sample of data:", JSON.parse(xhr.response));
    const SkillPlanner = new skillPlanner(JSON.parse(xhr.response));
  } else {
    console.log("Request failed.  Returned status of " + xhr.status);
  }
};
xhr.send();
