export function getRandomNumber(center, width) {
		let min = center - (width / 2);
		const max = center + (width / 2);
		return Math.random() * (max - min) + min
}