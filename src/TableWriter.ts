import CsvColumn from './CsvColumn';
import CsvRecord from './CsvRecord';

/**
 * Class resposible for rendering a provided list of CsvRecord's into an ASCII table
 */
export default class TableWriter
{
	/**
	 * Return a formatted text table
	 * @param records Records to be formatted
	 */
	public getFormattedTable(records: CsvRecord[]): string {
		// Get column lengths
		const columnLengths = this.getColumnLengths(records);

		// Build separator record
		const separatorRecord = this.buildSeparatorRecord(columnLengths);
		const separatorRecordLine = this.getFormattedRecord(separatorRecord, columnLengths, false);

		// Build table
		let result = '';

		// Write records
		for(var i = 0; i < records.length; i++) {
			const record = records[i];

			// Skip empty records
			if (record.getColumns().length === 0) {
				continue;
			}

			// Build formatted record
			const formattedRecord = this.getFormattedRecord(record, columnLengths, true);

			// Write Record Separator
			result += separatorRecordLine + "\r\n";

			// Write Record
			result += formattedRecord + "\r\n";
		}

		// Write final ending formatting record
		result += separatorRecordLine + "\r\n";

		// Return result
		return result;
	}

	/**
	 * Returns a CsvRecord that is suitable as a row separator
	 * @param columnLengths Column length map
	 */
	private buildSeparatorRecord(columnLengths: any[]): CsvRecord {
		const record = new CsvRecord();

		for(var i = 0; i < columnLengths.length; i++) {
			const colLength = columnLengths[i] + 2;
			const value = this.getRepeatedChar('-', colLength);

			record.addColumn(new CsvColumn(value));
		}

		return record;
	}

	/**
	 * Repeat the provided character N times
	 * @param char The character to repeat
	 * @param repeat Number of occurrances
	 */
	private getRepeatedChar(char: string, repeat: number): string {
		let result = '';

		for(var i = 0; i < repeat; i++) {
			result += char;
		}

		return result;
	}

	/**
	 * Return a string representation of the provided Record
	 * @param record The record to be formatted
	 * @param columnLengths Column length map
	 * @param useValuePadding Whether we are using value padding
	 */
	private getFormattedRecord(record: CsvRecord, columnLengths: any[], useValuePadding: boolean): string {
		const columns = record.getColumns();
		const ValuePadding = useValuePadding ? ' ' : '';
		const ColumnSeparator = '|';

		let result = '';

		// Iterate columns
		for(var i = 0; i < columns.length; i++) {
			// Get column
			const column = columns[i];
			const value = column.getValue();
			const maxLen = columnLengths[i] + ValuePadding.length + ColumnSeparator.length;

			// Calculate left and right padding
			const rightPaddingLength = maxLen - (ValuePadding.length * 2) - value.length;

			// Start with column separator?
			if (i === 0) {
				result += ColumnSeparator;
			}

			// Write left padding
			result += ValuePadding;

			// Write value
			result += value;

			// Write right padding
			result += this.getRepeatedChar(' ', rightPaddingLength);

			// End with separator
			result += ValuePadding;

			// End with column separator
			result += ColumnSeparator;
		}

		return result;
	}

	/**
	 * Calculate the maximum column lengths based on the provided Record set
	 * @param records Record data to analyze
	 */
	private getColumnLengths(records: CsvRecord[]): any[] {
		// Calculate column lengths
		let columnLengths = [];
		for(var i = 0; i < records.length; i++) {
			const record = records[i];
			const columns = record.getColumns();

			for(var colIndex = 0; colIndex < columns.length; colIndex++) {
				const len = columns[colIndex].getValue().length;

				if (columnLengths[colIndex] === undefined || len > columnLengths[colIndex]) {
					columnLengths[colIndex] = len;
				}
			}
		}

		return columnLengths;
	}
}
