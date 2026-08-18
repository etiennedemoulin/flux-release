function clamp(number, lower, upper) {
	return Math.min(Math.max(number, lower), upper);
}


export function getRandomNumber(center, width, lower = -Infinity, upper = Infinity) {
		const min = center - (width / 2);
		const max = center + (width / 2);
		const value = Math.random() * (max - min) + min;
		const clampedValue = clamp(value, lower, upper);
		return clampedValue;
}