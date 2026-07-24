const status = document.getElementById("status");
const gameTypeSelect = document.getElementById("game-type");
const boardSizeInput = document.getElementById("board-size");
const expandRulesBtn = document.getElementById("expand-rules");
const rulesDiv = document.getElementById("rules-div"),
	timeLimitRule = document.getElementById("rule-timelimit"),
	wildCardRule = document.getElementById("rule-wildcard"),
	minLengthRule = document.getElementById("rule-minlength");
const startGameBtn = document.getElementById("start-game");

startGameBtn.addEventListener("click", async () => {
	const gameType = gameTypeSelect.value;
	expandRulesBtn.textContent = "Rules (expand)";
	rulesDiv.style.display = "";
	const boardSize = parseInt(boardSizeInput.value);
	const rules = {
		wildCard: wildCardRule.checked,
		minLength: parseInt(minLengthRule.value),
		timeLimit: parseInt(timeLimitRule.value),
	};
	switch (gameType) {
		case "blitz":
			startGame(boardSize, rules);
			break;

		case "solver":
			let ended = false;
			const solver = new BoggleSolver(await getWordList());
			const board = await startGame(boardSize, rules, {
				endCallback: () => {
					for (const trigger of stopTriggers) trigger();
					ended = true;
				},
			});

			const stopTriggers = [];
			const solverWords = await solver.solve(board, rules, {
				spellCallback: async ({ words } = {}) => {
					if (!words) return;

					stopTriggers.push(await listWords(words, rules, true, 0.1));
				},
			});
			const solverScore = computeScore(solverWords, rules);
			while (!ended) {
				await delay(0);
			}
			setStatusLine(
				2,
				`Solver score: ${solverScore} points (${solverWords.length} words)`,
			);
			break;

		case "invite":
		case "multi":
		default:
			setStatus(`Game type "${gameType}" not implemented`);
			break;
	}
});
expandRulesBtn.addEventListener("click", () => {
	let expanded = rulesDiv.style.display !== "";
	if (expanded) {
		expandRulesBtn.textContent = "Rules (expand)";
		rulesDiv.style.display = "";
	} else {
		expandRulesBtn.textContent = "Rules (contract)";
		rulesDiv.style.display = "revert";
	}
});
