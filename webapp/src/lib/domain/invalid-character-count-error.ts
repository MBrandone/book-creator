export class InvalidCharacterCountError extends Error {
	constructor(count: number) {
		super(
			`Une histoire doit avoir entre 1 et 2 personnages, mais ${count} ont été fournis.`
		);
		this.name = "InvalidCharacterCountError";
	}
}
