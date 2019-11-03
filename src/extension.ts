// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { sep } from 'path';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(registerCsvToTableCommand(',', 'extension.csv-to-table.csv'));
	context.subscriptions.push(registerCsvToTableCommand('\t', 'extension.csv-to-table.tsv'));
	context.subscriptions.push(registerCsvToTableCommand('|', 'extension.csv-to-table.psv'));
}

/**
 * Helper method to register different commands
 * @param separator Separator to register
 * @param commandName Name of the command we are registering
 */
function registerCsvToTableCommand(separator: string, commandName: string): vscode.Disposable {
	let disposable = vscode.commands.registerCommand(commandName, function () {
		// Get the active text editor
		let editor = vscode.window.activeTextEditor;

		if (editor) {
			let document = editor.document;
			let selection = editor.selection;

			// Select full range if needed
			if (selection.isEmpty) {
				selection = new vscode.Selection(document.positionAt(0), document.positionAt(document.getText().length));
			}

			// Get selected text
			let text = document.getText(selection);

			// Create parser
			let parser = new CsvParser(text, separator);
			let records = parser.getRecords();

			let formatter = new TableWriter();
			let formattedResult = formatter.getFormattedTable(records);

			// Write result
			editor.edit(editBuilder => {
				editBuilder.replace(selection, formattedResult);
			});
		}
	});

	return disposable;
}

// this method is called when your extension is deactivated
export function deactivate() {}

/**
 * Class resposible for rendering a provided list of CsvRecord's into an ASCII table
 */
class TableWriter
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

/**
 * Parser that takes a string input and parsers it into a list of CsvRecord's that contain CsvColumn's
 */
export class CsvParser
{
	private _text: string;
	private _separator: string;
	private _position: number;

	/**
	 * Initialie a CsvParser using the provided text
	 * @param text The text to be parsed
	 */
	constructor(text: string, separator: string) {
		this._text = this.ensureEndOfRecord(text);
		this._separator = separator;
		this._position = 0;
	}

	/**
	 * Ensures the provided text ends with a new line
	 * @param text The processed text
	 */
	private ensureEndOfRecord(text: string): string {
		if (!this.isNewLine(text[text.length - 1])) {
			text += '\r\n';
		}

		return text;
	}

	/**
	 * Determines if we have reached the end of the input data
	 */
	private isEof(): boolean {
		return this._position >= this._text.length;
	}

	/**
	 * Parse the provided text and emit the parsed CsvRecords
	 */
	public getRecords(): CsvRecord[] {
		let records: CsvRecord[] = [];
		let currentRecord: CsvRecord = new CsvRecord();
		records.push(currentRecord);

		// Scan for records
		while(!this.isEof()) {
			// Parse column
			const columnResult = this.readColumn();

			// Add to existing Record
			currentRecord.addColumn(columnResult.getColumn());

			// Start new record?
			if (columnResult.getDidTerminateRecord() && !this.isEof()) {
				currentRecord = new CsvRecord();
				records.push(currentRecord);
			}
		}

		return records;
	}

	/**
	 * Peek at the current character in the input without advancing the position
	 */
	private peekChar(): string {
		return this._text.substr(this._position, 1);
	}

	/**
	 * Consumes the current character sequence until a column has been read
	 * Assumes it is starting with a potential quote character
	 */
	private readColumn(): CsvColumnResult {
		// Consume the current character sequence until we have a completed column
		let startingPosition = this._position;
		let isInQuote = false;
		let didTerminateRecord = false;
		let value = '';

		// Read character sequence
		for(; this._position < this._text.length; this._position++) {
			const char = this._text[this._position];
			const nextChar = this._position + 1 < this._text.length ? this._text[this._position + 1] : null;
			const isSeparator = this.isSeparator(char);
			const isQuote = char === '"';
			const isNewLine = this.isNewLine(char);

			// Is this column value quoted?
			if (startingPosition === this._position && isQuote) {
				isInQuote = true;
				continue;
			}

			// Have we encountered a separator or new line, that terminates this column?
			if (!isInQuote && (isSeparator || isNewLine)) {
				if (isNewLine) {
					didTerminateRecord = true;
				}

				break;
			}

			// Skip past an escaped quote?
			if (isInQuote && isQuote && nextChar === '"') {
				// Append single (un-escaped from double) quote
				// Then advanced past our escaped quote value
				value += char;
				this._position++;
				continue;
			}
		

			// Or, have we closed our quoted value?
			if (isInQuote && isQuote && nextChar !== '"') {
				break;
			}

			// Otherwise, continue reading column value
			value += char;
		}

		// Read past the upcoming separator characgter
		if (this.readPastSeparatorCharacter()) {
			didTerminateRecord = true;
		}

		// Return result
		const column = new CsvColumn(value);
		return new CsvColumnResult(column, didTerminateRecord);
	}

	/**
	 * Determine if the provided character appears to be a newline character
	 * @param char The character to check
	 */
	private isNewLine(char: string): boolean {
		return char === '\r' || char === '\n';
	}
	
	/**
	 * Determine if the provided character appears to be a separator character
	 * @param char The character to check
	 */
	private isSeparator(char: string): boolean {
		return char === this._separator;
	}
	
	/**
	 * Advance the current position to the next non-separator character
	 */
	private readPastSeparatorCharacter(): boolean {
		let didTerminateRecord = false;
		let didEncounterNonSeparatorOrNewLine = false;
		let initialPosition = this._position;

		while(!this.isEof()) {
			const char = this.peekChar();
			const isNewLine = this.isNewLine(char);
			const isSeparator = this.isSeparator(char);
			const isSeparatorOrNewLine = isSeparator || isNewLine;

			// If our first character being read is the separator, advance and bail out now
			if (initialPosition === this._position && isSeparator) {
				this._position++;
				break;
			}

			// Consider separators (eg ,) and new lines (record separators) as control characters
			// Skip past these so that we leave the next parser read starting at a new column (that may start with a quote)
			if (isSeparatorOrNewLine) {
				if (isNewLine) {
					didTerminateRecord = true;
				}

				// If we already encountered our separator before, return now as this could be a blank column value (eg: a,,b)
				if (didEncounterNonSeparatorOrNewLine && isSeparator) {
					break;
				}

				didEncounterNonSeparatorOrNewLine = true;
				this._position++;
				continue;
			}

			// If this is a quote, and we have not yet seen our separator, continue
			if (char === '"' && !didEncounterNonSeparatorOrNewLine) {
				this._position++;
				continue;
			}

			// Encountered non-separator
			break;
		}

		return didTerminateRecord;
	}
}

/**
 * Wrapper class around CsvColumn that also indicates whether the current Record has completed
 */
class CsvColumnResult
{
	private _column: CsvColumn;
	private _didTerminateRecord: boolean;

	constructor(column: CsvColumn, didTerminateRecord: boolean) {
		this._column = column;
		this._didTerminateRecord = didTerminateRecord;
	}

	/**
	 * Return the CsvColumn value
	 */
	public getColumn(): CsvColumn {
		return this._column;
	}

	/**
	 * Return whether the column also terminated the current CsvRecord
	 */
	public getDidTerminateRecord(): boolean {
		return this._didTerminateRecord;
	}
}

/**
 * Represents a column value in a CsvRecord
 */
class CsvColumn
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

/**
 * Represents a record in a CSV/TSV/PSV file
 */
class CsvRecord
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
