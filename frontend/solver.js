class BoggleSolver {
	constructor(words) {
		this.validWords = words;
	}

	yieldToBrowser() {
		return new Promise((resolve) => setTimeout(resolve, 0));
	}
	async solve(
		board,
		rules,
		callbacks = {
			spellCallback: () => { },
		},
	) {
		// neighbor helpers
		const neighborDirections = [
			[-1, -1],
			[-1, 0],
			[-1, 1],
			[0, -1],
			[0, 0],
			[0, 1],
			[1, -1],
			[1, 0],
			[1, 1],
		];
		const getNeighbors = (originIndex) => {
			return neighborDirections.map((direction) => {
				const xOffset = direction[1];
				const yOffset = direction[0];

				if (xOffset === 0 && yOffset === 0)
					return null; // don't return self
				else {
					const originXY = indexToXY(originIndex);
					originXY.x += xOffset;
					originXY.y += yOffset;
					if (
						originXY.x < 0 ||
						originXY.x >= boardSize ||
						originXY.y < 0 ||
						originXY.y >= boardSize
					)
						// out of bounds
						return null;
					return XYtoIndex(originXY.x, originXY.y);
				}
			});
		};

		// position helpers
		const indexToXY = (index) => {
			const x = index % boardSize;
			const y = Math.floor(index / boardSize);
			return { x, y };
		};
		const XYtoIndex = (x, y) => {
			return x + y * boardSize;
		};

		// board helpers
		const indexesToChars = (indexes) =>
			indexes.map((index) => board[index]).join("");

		// solve
		const boardSize = Math.sqrt(board.length);
		const startTime = Date.now();
		const foundWords = [];
		const solveRecursively = async ({
			tileIndex,
			tile,
			travelled = [],
			candidateWords = this.validWords
		} = {}) => {
			await this.yieldToBrowser();

			if (tile === "*" && !rules.wildCard) return; // blocked tile
			if (travelled.includes(tileIndex)) return; // cannot travel to already travelled tile
			if (Date.now() - startTime >= rules.timeLimit * 1e3) return; // all available time was spent
			travelled.push(tileIndex);

			const neighbors = getNeighbors(tileIndex);
			const chars = indexesToChars(travelled);
			const prefixRegex = new RegExp(
				`^${chars.replaceAll("*", ".")}`,
				"i",
			);
			const matchRegex = new RegExp(
				`^${chars.replaceAll("*", ".")}$`,
				"i",
			);

			/*
			console.log(
				"Travelling:", chars, tileIndex, travelled,
				'\nNeighbors:', neighbors
			);
			*/

			// there are no words with this prefix, so it's no use searching deeper
			if (candidateWords.every((word) => !prefixRegex.test(word)))
				return;

			// check if any word passes the regex test and report back
			const wordsFound = candidateWords.filter(
				(word) =>
					matchRegex.test(word) &&
					!foundWords.includes(word) &&
					word.length >= rules.minLength,
			);
			if (wordsFound.length > 0) {
				callbacks.spellCallback({ words: wordsFound });
				for (const wordFound of wordsFound) {
					callbacks.spellCallback({ word: wordFound });
					// console.log("Word found:", wordFound, travelled);
					foundWords.push(wordFound);
				}
			}
			candidateWords = candidateWords.filter((word) => prefixRegex.test(word));

			// search deeper
			for (const [neighborIndex, neighborTile] of neighbors.entries()) {
				if (neighborTile == null) continue;
				if (travelled.includes(neighborIndex)) continue;

				await solveRecursively({
					tileIndex: neighborTile,
					tile: board[neighborTile],
					travelled: [...travelled],
					candidateWords
				});
			}
		};
		for (const [index, tile] of board.entries()) {
			await solveRecursively({
				tileIndex: index,
				tile,
			});
		}
		return foundWords.sort((a, b) => a.localeCompare(b));
	}
}
