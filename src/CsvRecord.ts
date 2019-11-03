import CsvColumn from './CsvColumn';

/**
 * Represents a record in a CSV/TSV/PSV file
 */
export default class CsvRecord
{
	private _columns: CsvColumn[] = [];

	/**
	 * Add the provided column to the Record
	 * @param column The column to add
	 */
	public addColumn(column: CsvColumn) {
		this._columns.push(column);
	}

	/**
	 * Return the list of available columns for this Record
	 */
	public getColumns(): CsvColumn[] {
		return this._columns;
	}
}
