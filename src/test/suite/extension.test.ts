import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import CsvParser from '../../CsvParser';
import TableWriter from '../../TableWriter';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Can handle empty right aligned cell value', () => {
		// Arrange
		const parser = new CsvParser('2022,Name,Value\n"","",""', ',');
		const writer = new TableWriter();

		// Act
		const records = parser.getRecords();
		const result = writer.getFormattedTable(records, false, false, true);

		console.log(result);

		// Assert
		assert.equal(`
|------|------|-------|
| 2022 | Name | Value |
|------|------|-------|
|      |      |       |
|------|------|-------|
`.trim(), result.replace(/\r?\n/g, "\n").trim());
	});

	test('Can right align cell values that contain numbers', () => {
		// Arrange
		const parser = new CsvParser('2022,Name,Value\nExample Value,Andrew,12345.67\nTest Value,Lisa,35\n123,John,"19.600,12"\nABC,Megan,"12.34,56"\n55,Alex,"1,234"\n-1,Plus Minus,+1.50', ',');
		const writer = new TableWriter();

		// Act
		const records = parser.getRecords();
		const result = writer.getFormattedTable(records, false, false, true);

		console.log(result);

		// Assert
		assert.equal(`
|---------------|------------|-----------|
|          2022 | Name       | Value     |
|---------------|------------|-----------|
| Example Value | Andrew     |  12345.67 |
|---------------|------------|-----------|
| Test Value    | Lisa       |        35 |
|---------------|------------|-----------|
|           123 | John       | 19.600,12 |
|---------------|------------|-----------|
| ABC           | Megan      |  12.34,56 |
|---------------|------------|-----------|
|            55 | Alex       |     1,234 |
|---------------|------------|-----------|
|            -1 | Plus Minus |     +1.50 |
|---------------|------------|-----------|
`.trim(), result.replace(/\r?\n/g, "\n").trim());
	});

	test('Can write output using TableWriter (Markdowm output format)', () => {
		// Arrange
		const parser = new CsvParser('Name,Age\nAndrew,30\nLisa,35', ',');
		const writer = new TableWriter();

		// Act
		const records = parser.getRecords();
		const result = writer.getFormattedTable(records, false, true, false);

		// Assert
		assert.equal(`
| Name   | Age |
|--------|-----|
| Andrew | 30  |
| Lisa   | 35  |
	`.trim(), result.replace(/\r?\n/g, "\n").trim());
	});

	test('Can write output using TableWriter (upper-case headers)', () => {
		// Arrange
		const parser = new CsvParser('Name,Age\nAndrew,30', ',');
		const writer = new TableWriter();

		// Act
		const records = parser.getRecords();
		const result = writer.getFormattedTable(records, true, false, false);

		// Assert
		assert.equal(`
|--------|-----|
| NAME   | AGE |
|--------|-----|
| Andrew | 30  |
|--------|-----|
	`.trim(), result.replace(/\r?\n/g, "\n").trim());
	});

	test('Can write output using TableWriter', () => {
		// Arrange
		const parser = new CsvParser('Name,Age\nAndrew,30', ',');
		const writer = new TableWriter();

		// Act
		const records = parser.getRecords();
		const result = writer.getFormattedTable(records, false, false, false);

		// Assert
		assert.equal(`
|--------|-----|
| Name   | Age |
|--------|-----|
| Andrew | 30  |
|--------|-----|
	`.trim(), result.replace(/\r?\n/g, "\n").trim());
	});

	test('Can handle leading spaces before quotes in column value', () => {
		// Arrange
		const parser = new CsvParser('1, "two" ,"three"', ',');

		// Act
		const records = parser.getRecords();
		const record = records[0];
		const columns = record.getColumns();

		// Assert
		assert.equal(1, records.length);
		assert.equal(3, columns.length);

		// Validate records
		assert.equal("1", columns[0].getValue());
		assert.equal("two", columns[1].getValue());
		assert.equal("three", columns[2].getValue());
	});

	test('Can handle blank value in last column', () => {
		// Arrange
		const parser = new CsvParser('1,', ',');

		// Act
		const records = parser.getRecords();
		const record = records[0];
		const columns = record.getColumns();

		// Assert
		assert.equal(1, records.length);
		assert.equal(2, columns.length);

		// Validate records
		assert.equal("1", columns[0].getValue());
		assert.equal("", columns[1].getValue());
	});

	test('Can handle blank value in last column in two record CSV', () => {
		// Arrange
		const parser = new CsvParser("1,\r\n3,4", ',');

		// Act
		const records = parser.getRecords();
		const record = records[0];
		const columns = record.getColumns();

		// Assert
		assert.equal(2, records.length);
		assert.equal(2, columns.length);

		// Validate records
		assert.equal("1", columns[0].getValue());
		assert.equal("", columns[1].getValue());
	});

	test('Can handle blank value in first column', () => {
		// Arrange
		const parser = new CsvParser(',2', ',');

		// Act
		const records = parser.getRecords();
		const record = records[0];
		const columns = record.getColumns();

		// Assert
		assert.equal(1, records.length);
		assert.equal(2, columns.length);

		// Validate records
		assert.equal("", columns[0].getValue());
		assert.equal("2", columns[1].getValue());
	});

	test('Can handle blank value in middle column', () => {
		// Arrange
		const parser = new CsvParser('1,,3', ',');

		// Act
		const records = parser.getRecords();
		const record = records[0];
		const columns = record.getColumns();

		// Assert
		assert.equal(1, records.length);
		assert.equal(3, columns.length);

		// Validate records
		assert.equal("1", columns[0].getValue());
		assert.equal("", columns[1].getValue());
		assert.equal("3", columns[2].getValue());
	});

	test('Can parse using space as separator', () => {
		// Arrange
		const parser = new CsvParser('1 "quoted with space" 3', ' ');

		// Act
		const records = parser.getRecords();
		const record = records[0];
		const columns = record.getColumns();

		// Assert
		assert.equal(1, records.length);
		assert.equal(3, columns.length);

		// Validate records
		assert.equal("1", columns[0].getValue());
		assert.equal("quoted with space", columns[1].getValue());
		assert.equal("3", columns[2].getValue());
	});

	test('Can parse simple CSV', () => {
		// Arrange
		const parser = new CsvParser('1,2,3', ',');

		// Act
		const records = parser.getRecords();
		const record = records[0];
		const columns = record.getColumns();

		// Assert
		assert.equal(1, records.length);
		assert.equal(3, columns.length);

		// Validate records
		assert.equal("1", columns[0].getValue());
		assert.equal("2", columns[1].getValue());
		assert.equal("3", columns[2].getValue());
	});

	test('Can parse simple PSV', () => {
		// Arrange
		const parser = new CsvParser('1|2|3', '|');

		// Act
		const records = parser.getRecords();
		const record = records[0];
		const columns = record.getColumns();

		// Assert
		assert.equal(1, records.length);
		assert.equal(3, columns.length);

		// Validate records
		assert.equal("1", columns[0].getValue());
		assert.equal("2", columns[1].getValue());
		assert.equal("3", columns[2].getValue());
	});

	test('Can parse simple Semi-Colon SSV', () => {
		// Arrange
		const parser = new CsvParser('1;2;3', ';');

		// Act
		const records = parser.getRecords();
		const record = records[0];
		const columns = record.getColumns();

		// Assert
		assert.equal(1, records.length);
		assert.equal(3, columns.length);

		// Validate records
		assert.equal("1", columns[0].getValue());
		assert.equal("2", columns[1].getValue());
		assert.equal("3", columns[2].getValue());
	});

	test('Can parse simple TSV', () => {
		// Arrange
		const parser = new CsvParser("1\t2\t3", '\t');

		// Act
		const records = parser.getRecords();
		const record = records[0];
		const columns = record.getColumns();

		// Assert
		assert.equal(1, records.length);
		assert.equal(3, columns.length);

		// Validate records
		assert.equal("1", columns[0].getValue());
		assert.equal("2", columns[1].getValue());
		assert.equal("3", columns[2].getValue());
	});

	test('Can parse simple TSV and commas', () => {
		// Arrange
		const parser = new CsvParser("1\tshould,be,ignored\t3", '\t');

		// Act
		const records = parser.getRecords();
		const record = records[0];
		const columns = record.getColumns();

		// Assert
		assert.equal(1, records.length);
		assert.equal(3, columns.length);

		// Validate records
		assert.equal("1", columns[0].getValue());
		assert.equal("should,be,ignored", columns[1].getValue());
		assert.equal("3", columns[2].getValue());
	});

	test('Can parse double quoted value', () => {
		// Arrange
		const parser = new CsvParser('1,"This is a ""quoted"" word",3', ',');

		// Act
		const records = parser.getRecords();
		const record = records[0];
		const columns = record.getColumns();

		// Assert
		assert.equal(1, records.length);
		assert.equal(3, columns.length);

		// Validate records
		assert.equal("1", columns[0].getValue());
		assert.equal('This is a "quoted" word', columns[1].getValue());
		assert.equal("3", columns[2].getValue());
	});

	test('Can parse repeated double quoted value', () => {
		// Arrange
		const parser = new CsvParser('1,"This is a """"quoted"""""" word",3', ',');

		// Act
		const records = parser.getRecords();
		const record = records[0];
		const columns = record.getColumns();

		// Assert
		assert.equal(1, records.length);
		assert.equal(3, columns.length);

		// Validate records
		assert.equal("1", columns[0].getValue());
		assert.equal('This is a ""quoted""" word', columns[1].getValue());
		assert.equal("3", columns[2].getValue());
	});

	test('Can parse quoted value CSV', () => {
		// Arrange
		const parser = new CsvParser('1,"hello world","with a, comma"', ',');

		// Act
		const records = parser.getRecords();
		const record = records[0];
		const columns = record.getColumns();

		// Assert
		assert.equal(1, records.length);
		assert.equal(3, columns.length);

		// Validate records
		assert.equal("1", columns[0].getValue());
		assert.equal("hello world", columns[1].getValue());
		assert.equal("with a, comma", columns[2].getValue());
	});

	test('Can parse single column CSV', () => {
		// Arrange
		const parser = new CsvParser('1', ',');

		// Act
		const records = parser.getRecords();
		const record = records[0];
		const columns = record.getColumns();

		// Assert
		assert.equal(1, records.length);
		assert.equal(1, columns.length);

		// Validate records
		assert.equal("1", columns[0].getValue());
	});

	test('Can interpret new line in quoted column as value', () => {
		// Arrange
		const parser = new CsvParser("\"first\r\ncolumn\",second column", ',');

		// Act
		const records = parser.getRecords();
		const record = records[0];
		const columns = record.getColumns();

		// Assert
		assert.equal(1, records.length);
		assert.equal(2, columns.length);

		// Validate records
		assert.equal("first\r\ncolumn", columns[0].getValue());
		assert.equal("second column", columns[1].getValue());
	});

	test('Can parse multi-line CSV', () => {
		// Arrange
		const parser = new CsvParser("a,b\r\nc,\"quoted\"", ',');

		// Act
		const records = parser.getRecords();
		const columns1 = records[0].getColumns();
		const columns2 = records[1].getColumns();

		// Assert
		assert.equal(2, records.length);
		assert.equal(2, columns1.length);
		assert.equal(2, columns2.length);

		// Validate records
		assert.equal("a", columns1[0].getValue());
		assert.equal("b", columns1[1].getValue());

		assert.equal("c", columns2[0].getValue());
		assert.equal("quoted", columns2[1].getValue());
	});
});
