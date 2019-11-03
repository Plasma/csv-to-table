import CsvColumn from './CsvColumn';
import CsvRecord from './CsvRecord';

/**
 * Parser that takes a string input and parsers it into a list of CsvRecord's that contain CsvColumn's
 */
export default class CsvParser
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
	 * Advance our position to the first quote, if one looks to exist amongst leading spaces
	 */
	private advanceToQuoteIfLeadingSpaces(): void {
		for(var i = this._position; i < this._text.length; i++) {
			const char = this._text[i];

			// If this is a space, continue to next character
			if (char === ' ') {
				continue;
			}

			// If this is a quote, advance our position to this value
			if (char === '"') {
				this._position = i;
			}

			// Break out
			break;
		}
	}

	/**
	 * Consumes the current character sequence until a column has been read
	 * Assumes it is starting with a potential quote character
	 */
	private readColumn(): CsvColumnResult {
		// If the column has leading spaces, followed by a quote, then we should jump to the quote character
		this.advanceToQuoteIfLeadingSpaces();

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

			// Must have encountered our separator or newline
			if (!didEncounterNonSeparatorOrNewLine) {
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
