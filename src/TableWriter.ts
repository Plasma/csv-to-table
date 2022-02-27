import { isNumber } from 'util';
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
	public getFormattedTable(records: CsvRecord[], upperCaseHeader: boolean, useMarkdownFormat: boolean, rightAlignNumbers: boolean): string {
		// Get column lengths
		const columnLengths = this.getColumnLengths(records);

		// Build separator record
		const separatorRecord = this.buildSeparatorRecord(columnLengths);
		const separatorRecordLine = this.getFormattedRecord(separatorRecord, columnLengths, false, false, rightAlignNumbers);

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
			const upperCaseRecordValue = upperCaseHeader && i === 0;
			const formattedRecord = this.getFormattedRecord(record, columnLengths, true, upperCaseRecordValue, rightAlignNumbers);

			// Write Record Separator
			// When using Markdown format, we only want to write this once after the initial header row
			if (!useMarkdownFormat || i === 1)
				result += separatorRecordLine + "\r\n";

			// Write Record
			result += formattedRecord + "\r\n";
		}

		// Write final ending formatting record (if not using Markdown format)
		if (!useMarkdownFormat)
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
		if (repeat <= 0) {
			return '';
		}

		return char.repeat(repeat);
	}

	/**
	 * Return a string representation of the provided Record
	 * @param record The record to be formatted
	 * @param columnLengths Column length map
	 * @param useValuePadding Whether we are using value padding
	 */
	private getFormattedRecord(record: CsvRecord, columnLengths: any[], useValuePadding: boolean, upperCaseValue: boolean, rightAlignNumbers: boolean): string {
		const columns = record.getColumns();
		const ValuePadding = useValuePadding ? ' ' : '';
		const ColumnSeparator = '|';

		let result = '';

		// Iterate columns
		for(var i = 0; i < columns.length; i++) {
			// Get column
			const column = columns[i];
			let value = column.getValue();
			const maxLen = columnLengths[i] + ValuePadding.length + ColumnSeparator.length;

			// Upper-case transform this value?
			if (upperCaseValue) {
				value = value.toUpperCase();
			}

			// Calculate left and right padding
			const isRightAligned = rightAlignNumbers && this.isNumberValue(value);
			const leftPaddingLength = useValuePadding ? (isRightAligned ? maxLen - value.length - 1 : 1) : 0;
			const rightPaddingLength = isRightAligned ? 0 : maxLen - (ValuePadding.length * 2) - value.length;

			// Start with column separator?
			if (i === 0) {
				result += ColumnSeparator;
			}

			// Write left padding
			result += this.getRepeatedChar(' ', leftPaddingLength);

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

	/**
	 * Determine if the provided cell value appears to be a number
	 * @param value string value to analyze
	 */
	private isNumberValue(value: string): boolean {
		// Early return
		if (value.length === 0)
			return false;

		// Look for number-like characters
		for(let i = 0; i < value.length; i++) {
			const char = value[i];

			// Check for number signs
			if (char === '+' || char === '-' || char === ',' || char === '.')
				continue;

			// Check for digits
			if (char >= '0' && char <= '9')
				continue;

			// Not a number
			return false;
		}

		// Appears to be a number
		return true;
	}
}
