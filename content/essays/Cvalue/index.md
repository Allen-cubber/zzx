---
title: 个人学习成绩积分 C 值计算器
date: 2025-10-02T10:00:00+08:00
draft: true
---
<div id="c-calculator-app">
<div class="app-container">
<!-- 左侧：课程库 -->
<div class="panel master-list-panel">
<h3>课程库</h3>
<input type="text" id="search-box" placeholder="搜索课程名称...">
<ul id="master-list">
<!-- JS 会在这里填充课程 -->
</ul>
<button id="add-course-btn" disabled>--&gt; 添加选中课程 --&gt;</button>
</div>
<!-- 右侧：我的课程 -->
<div class="panel selected-list-panel">
<h3>我的课程</h3>
<div class="selected-list-header">
<span class="col-name">课程名称</span>
<span class="col-score">分数</span>
<span class="col-credits">学分</span>
<span class="col-action"></span>
</div>
<div id="selected-list">
<!-- JS 会在这里填充已选课程 -->
</div>
</div>
</div>
<!-- 底部：计算与结果 -->
<div class="controls-panel">
<div class="buttons">
<button id="calculate-btn">计算我的 C 值</button>
<button id="report-btn">生成成绩报告</button>
</div>
<div id="result-display">请添加课程并填写分数/学分</div>
</div>
</div>
<!-- CSS 样式 -->
<style>
#c-calculator-app {
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
border: 1px solid #ccc;
border-radius: 8px;
padding: 20px;
max-width: 900px;
margin: 20px auto;
box-shadow: 0 2px 8px rgba(0,0,0,0.1);
background: #f9f9f9;
}
.app-container {
display: flex;
gap: 20px;
min-height: 400px;
flex-wrap: wrap;
}
.panel {
flex: 1;
padding: 15px;
border: 1px solid #ddd;
border-radius: 5px;
background: #fff;
display: flex;
flex-direction: column;
}
.master-list-panel { min-width: 300px; }
.selected-list-panel { min-width: 400px; flex-grow: 1.5; }
h3 { margin-top: 0; }
#search-box {
width: 100%;
padding: 8px;
box-sizing: border-box;
margin-bottom: 10px;
border: 1px solid #ccc;
border-radius: 4px;
}
#master-list {
list-style: none;
padding: 0;
margin: 0;
overflow-y: auto;
height: 280px;
border: 1px solid #eee;
}
#master-list li {
padding: 8px 12px;
cursor: pointer;
border-bottom: 1px solid #eee;
transition: background-color 0.2s;
}
#master-list li:hover { background-color: #f0f0f0; }
#master-list li.selected {
background-color: #007bff;
color: white;
}
#add-course-btn {
margin-top: 10px;
padding: 10px;
border: none;
background-color: #28a745;
color: white;
border-radius: 5px;
cursor: pointer;
}
#add-course-btn:disabled {
background-color: #ccc;
cursor: not-allowed;
}
.selected-list-header {
display: flex;
font-weight: bold;
padding: 5px;
border-bottom: 2px solid #333;
margin-bottom: 5px;
}
.col-name { flex: 3; }
.col-score, .col-credits { flex: 1; text-align: center; }
.col-action { width: 60px; }
#selected-list {
overflow-y: auto;
flex-grow: 1;
}
.selected-item {
display: flex;
align-items: center;
padding: 5px;
border-bottom: 1px solid #eee;
}
.selected-item span { flex: 3; word-break: break-all; }
.selected-item input {
flex: 1;
width: 50px;
padding: 5px;
text-align: center;
border: 1px solid #ccc;
border-radius: 4px;
margin: 0 5px;
}
.selected-item button {
width: 60px;
padding: 5px;
background: #dc3545;
color: white;
border: none;
border-radius: 4px;
cursor: pointer;
}
.controls-panel {
margin-top: 20px;
text-align: center;
}
.controls-panel .buttons { margin-bottom: 15px; }
.controls-panel button {
padding: 12px 25px;
font-size: 16px;
margin: 0 10px;
border-radius: 5px;
border: none;
cursor: pointer;
background-color: #007bff;
color: white;
}
#result-display {
font-size: 1.5em;
font-weight: bold;
color: #17a2b8;
}
@media (max-width: 768px) {
.app-container {
flex-direction: column;
}
}
</style>
<!-- JavaScript 逻辑 -->
<script>
document.addEventListener('DOMContentLoaded', function() {
const allCoursesData = [
{"name": "无线通信", "avg_score": 97, "is_own_college": "是"},
{"name": "电路分析与综合", "avg_score": 96.5, "is_own_college": "是"},
{"name": "Computer Vision and its Applic", "avg_score": 94.6667, "is_own_college": "是"},
{"name": "英语口语", "avg_score": 93.8, "is_own_college": "否"},
{"name": "近代信息理论", "avg_score": 93.6914, "is_own_college": "是"},
{"name": "人工智能理论及应用", "avg_score": 93.5714, "is_own_college": "否"},
{"name": "Theory and Design of Modern RF", "avg_score": 93, "is_own_college": "是"},
{"name": "高级人工智能", "avg_score": 92.9, "is_own_college": "否"},
{"name": "现代信息处理理论", "avg_score": 92.9, "is_own_college": "是"},
{"name": "Wearable Systems", "avg_score": 92.5556, "is_own_college": "是"},
{"name": "Linux与嵌入式通信系统I", "avg_score": 92.4, "is_own_college": "是"},
{"name": "沟通心理学", "avg_score": 91.2963, "is_own_college": "否"},
{"name": "统计学习理论及机器学习", "avg_score": 90.5714, "is_own_college": "是"},
{"name": "计算智能与启发式算法", "avg_score": 90.3333, "is_own_college": "是"},
{"name": "经济学原理", "avg_score": 90.3125, "is_own_college": "否"},
{"name": "工程伦理", "avg_score": 89.8366, "is_own_college": "否"},
{"name": "项目管理概论", "avg_score": 89.7, "is_own_college": "否"},
{"name": "集成电路互连与电磁兼容", "avg_score": 89.4286, "is_own_college": "是"},
{"name": "学术交流英语", "avg_score": 89, "is_own_college": "否"},
{"name": "射频电路与天线专题i", "avg_score": 88.4, "is_own_college": "是"},
{"name": "英文电影欣赏", "avg_score": 88.3333, "is_own_college": "否"},
{"name": "论文写作与学术规范", "avg_score": 88.0381, "is_own_college": "是"},
{"name": "移动通信天线", "avg_score": 87.931, "is_own_college": "是"},
{"name": "信息传输与处理", "avg_score": 87.9286, "is_own_college": "是"},
{"name": "第二外语（日语）", "avg_score": 87.75, "is_own_college": "否"},
{"name": "模拟集成电路分析与设计", "avg_score": 87.75, "is_own_college": "否"},
{"name": "跨文化交流韩语", "avg_score": 87.6, "is_own_college": "否"},
{"name": "心理学与生活", "avg_score": 87.4366, "is_own_college": "否"},
{"name": "智能计算方法", "avg_score": 87.1579, "is_own_college": "否"},
{"name": "交友心理学", "avg_score": 87, "is_own_college": "否"},
{"name": "数值分析（科学与工程计算基础）", "avg_score": 86.875, "is_own_college": "否"},
{"name": "Embedded System and Mobile App", "avg_score": 86.6667, "is_own_college": "是"},
{"name": "深度学习", "avg_score": 86.32, "is_own_college": "是"},
{"name": "中国文化", "avg_score": 86, "is_own_college": "否"},
{"name": "国际会议交流与学术论文写作", "avg_score": 85.4531, "is_own_college": "否"},
{"name": "语音信号处理", "avg_score": 85.4444, "is_own_college": "是"},
{"name": "自然辩证法概论", "avg_score": null, "is_own_college": "否"},
{"name": "新时代中国特色社会主义理论与实践", "avg_score": null, "is_own_college": "否"},
{"name": "射频电路分析与设计", "avg_score": 84.8454, "is_own_college": "是"},
{"name": "机器智能与数据科学", "avg_score": 84.7426, "is_own_college": "是"},
{"name": "智能优化算法", "avg_score": 84.4444, "is_own_college": "否"},
{"name": "综合英语", "avg_score": null, "is_own_college": "否"},
{"name": "中国马克思主义与当代", "avg_score": 83.7541, "is_own_college": "否"},
{"name": "知识产权法", "avg_score": 83.6548, "is_own_college": "否"},
{"name": "Digital Signal Processing", "avg_score": 83.5, "is_own_college": "是"},
{"name": "数字集成电路理论与设计", "avg_score": 83.5, "is_own_college": "否"},
{"name": "英语电影与跨文化交际", "avg_score": 83.3571, "is_own_college": "否"},
{"name": "水声信号处理", "avg_score": 83.2727, "is_own_college": "是"},
{"name": "初级听力I", "avg_score": 83, "is_own_college": "否"},
{"name": "射频集成电路理论与设计", "avg_score": 83, "is_own_college": "是"},
{"name": "信息论及其发展", "avg_score": 82.6667, "is_own_college": "是"},
{"name": "Signals and Systems", "avg_score": 82, "is_own_college": "是"},
{"name": "5G通信系统", "avg_score": 81.7368, "is_own_college": "是"},
{"name": "艺术作品中的历史与文化", "avg_score": 81.697, "is_own_college": "否"},
{"name": "数字图像处理", "avg_score": 81.2727, "is_own_college": "是"},
{"name": "物联网工程讲座", "avg_score": 81.2273, "is_own_college": "是"},
{"name": "社会创新与创业", "avg_score": 80.7273, "is_own_college": "否"},
{"name": "管理学原理", "avg_score": 80.6667, "is_own_college": "否"},
{"name": "广东文化概要", "avg_score": 80.6, "is_own_college": "否"},
{"name": "现代编码理论与技术", "avg_score": 80.32, "is_own_college": "是"},
{"name": "初级汉语I", "avg_score": 80, "is_own_college": "否"},
{"name": "数理统计理论与方法", "avg_score": 79.7687, "is_own_college": "否"},
{"name": "高等电磁场理论", "avg_score": 79.6939, "is_own_college": "是"},
{"name": "随机过程", "avg_score": 79.6495, "is_own_college": "否"},
{"name": "中国概况", "avg_score": 79, "is_own_college": "否"},
{"name": "矩阵分析", "avg_score": 72.4, "is_own_college": "否"},
{"name": "信息素养—学术研究的必修课", "avg_score": 72, "is_own_college": "否"},
{"name": "初级听力II", "avg_score": 71.875, "is_own_college": "否"},
{"name": "最优化计算", "avg_score": 67.3333, "is_own_college": "否"},
{"name": "初级汉语II", "avg_score": 66.875, "is_own_college": "否"},
{"name": "现代数字信号处理", "avg_score": 75.209, "is_own_college": "是"},
{"name": "现代通信理论与新技术", "avg_score": 80.725, "is_own_college": "是"}
];
const coursesMap = new Map(allCoursesData.map(c => [c.name, c]));
const searchBox = document.getElementById('search-box');
const masterList = document.getElementById('master-list');
const addCourseBtn = document.getElementById('add-course-btn');
const selectedList = document.getElementById('selected-list');
const calculateBtn = document.getElementById('calculate-btn');
const reportBtn = document.getElementById('report-btn');
const resultDisplay = document.getElementById('result-display');
let selectedMasterCourseName = null;
const selectedCourses = new Map();
function renderMasterList(filter = '') {
masterList.innerHTML = '';
const lowerCaseFilter = filter.toLowerCase();
allCoursesData.forEach(course => {
if (course.name.toLowerCase().includes(lowerCaseFilter)) {
const li = document.createElement('li');
li.textContent = course.name;
li.dataset.courseName = course.name;
if (course.name === selectedMasterCourseName) {
li.classList.add('selected');
}
masterList.appendChild(li);
}
});
}
function addCourse() {
if (!selectedMasterCourseName || selectedCourses.has(selectedMasterCourseName)) {
return;
}
const courseName = selectedMasterCourseName;
const itemDiv = document.createElement('div');
itemDiv.className = 'selected-item';
itemDiv.dataset.courseName = courseName;
itemDiv.innerHTML = `
<span>${courseName}</span>
<input type="number" class="score-input" placeholder="分数" min="0" max="150" step="0.1">
<input type="number" class="credits-input" placeholder="学分" min="0" max="10" step="0.5">
<button class="remove-btn">移除</button>
`;
selectedList.appendChild(itemDiv);
const removeBtn = itemDiv.querySelector('.remove-btn');
removeBtn.addEventListener('click', () => removeCourse(courseName));
selectedCourses.set(courseName, {
element: itemDiv,
scoreInput: itemDiv.querySelector('.score-input'),
creditsInput: itemDiv.querySelector('.credits-input')
});
}
function removeCourse(courseName) {
if (selectedCourses.has(courseName)) {
selectedCourses.get(courseName).element.remove();
selectedCourses.delete(courseName);
}
}
function performCalculation() {
let includedCourses = [], excludedCourses = [];
let totalWeightedScore = 0.0, totalCreditsIncluded = 0.0;
selectedCourses.forEach((widgets, name) => {
const scoreStr = widgets.scoreInput.value;
const creditsStr = widgets.creditsInput.value;
const courseInfo = coursesMap.get(name);
if (!scoreStr || !creditsStr) {
excludedCourses.push({ name, reason: '分数或学分未填写' });
return;
}
const originalScore = parseFloat(scoreStr);
const credits = parseFloat(creditsStr);
if (isNaN(originalScore) || isNaN(credits)) {
excludedCourses.push({ name, reason: '分数或学分输入无效' });
return;
}
if (courseInfo.is_own_college !== '是') {
excludedCourses.push({ name, reason: '非本院课程' });
return;
}
let calculatedScore = 0;
if (courseInfo.avg_score === null) {
calculatedScore = originalScore;
} else {
const avgScore = courseInfo.avg_score;
calculatedScore = (avgScore > 0) ? (85 / avgScore) * originalScore : originalScore;
}
const weightedScore = calculatedScore * credits;
totalWeightedScore += weightedScore;
totalCreditsIncluded += credits;
includedCourses.push({
name, original_score: originalScore, credits,
calculated_score: calculatedScore, weighted_score: weightedScore
});
});
const finalCValue = totalCreditsIncluded > 0 ? totalWeightedScore / totalCreditsIncluded : 0;
return {
final_c_value: finalCValue,
total_weighted_score: totalWeightedScore,
total_credits_included: totalCreditsIncluded,
included_courses: includedCourses,
excluded_courses: excludedCourses
};
}
function displayCalculationResult() {
const calcData = performCalculation();
if (calcData.total_credits_included === 0) {
resultDisplay.textContent = "没有可用于计算的课程或学分。";
} else {
resultDisplay.textContent = `计算完成！您的 C 值为: ${calcData.final_c_value.toFixed(4)}`;
}
}
function generateReport() {
const calcData = performCalculation();
if (!calcData.included_courses.length && !calcData.excluded_courses.length) {
alert("请先添加课程并填写数据后再生成报告。");
return;
}
const now = new Date().toLocaleString('sv-SE');
let reportContent = [];
reportContent.push("=".repeat(50));
reportContent.push("          个人学习成绩积分 C 值计算报告");
reportContent.push("=".repeat(50));
reportContent.push(`报告生成时间: ${now}\n`);
reportContent.push("-".repeat(20) + " 计算结果汇总 " + "-".repeat(20));
reportContent.push(`最终 C 值: ${calcData.final_c_value.toFixed(4)}`);
reportContent.push(`总加权成绩: ${calcData.total_weighted_score.toFixed(4)}`);
reportContent.push(`总计入学分: ${calcData.total_credits_included.toFixed(2)}\n`);
reportContent.push("-".repeat(20) + " 计入计算的课程详情 " + "-".repeat(15));
if (calcData.included_courses.length > 0) {
const header = `${'课程名称'.padEnd(28)} ${'原始分'.padStart(6)} ${'学分'.padStart(5)} ${'折算分'.padStart(8)} ${'加权成绩'.padStart(10)}`;
reportContent.push(header);
reportContent.push("-".repeat(header.length + 5));
calcData.included_courses.forEach(course => {
const line = `${course.name.padEnd(28).slice(0, 28)} ${course.original_score.toFixed(2).padStart(6)} ${course.credits.toFixed(1).padStart(5)} ${course.calculated_score.toFixed(2).padStart(8)} ${course.weighted_score.toFixed(2).padStart(10)}`;
reportContent.push(line);
});
} else {
reportContent.push("无");
}
reportContent.push("\n");
reportContent.push("-".repeat(20) + " 未计入计算的课程 " + "-".repeat(17));
if (calcData.excluded_courses.length > 0) {
calcData.excluded_courses.forEach(course => {
reportContent.push(`- ${course.name}: ${course.reason}`);
});
} else {
reportContent.push("无");
}
reportContent.push("\n" + "=".repeat(50));
const blob = new Blob([reportContent.join('\n')], { type: 'text/plain;charset=utf-8' });
const link = document.createElement('a');
link.href = URL.createObjectURL(blob);
link.download = `C值计算报告_${now.replace(/[: ]/g, '_')}.txt`;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
}
searchBox.addEventListener('input', () => renderMasterList(searchBox.value));
masterList.addEventListener('click', (e) => {
if (e.target.tagName === 'LI') {
const currentSelected = masterList.querySelector('.selected');
if (currentSelected) {
currentSelected.classList.remove('selected');
}
e.target.classList.add('selected');
selectedMasterCourseName = e.target.dataset.courseName;
addCourseBtn.disabled = false;
}
});
addCourseBtn.addEventListener('click', addCourse);
calculateBtn.addEventListener('click', displayCalculationResult);
reportBtn.addEventListener('click', generateReport);
renderMasterList();
});
</script>