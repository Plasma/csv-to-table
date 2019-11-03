/**
 * Represents a column value in a CsvRecord
 */
export default class CsvColumn
{
	private _value: string;

	constructor(value: string) {
		this._value = value;
	}

	/**
	 * Return the value of this column
	 */
	public getValue(): string {
		return this._value;
	}
}