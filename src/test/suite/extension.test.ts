import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as ext from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Can parse simple CSV', () => {
		// Arrange
		const parser = new ext.CsvParser('1,2,3', ',');

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

	test('Can parse double quoted value', () => {
		// Arrange
		const parser = new ext.CsvParser('1,"This is a ""quoted"" word",3', ',');

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
		const parser = new ext.CsvParser('1,"This is a """"quoted"""""" word",3', ',');

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
		const parser = new ext.CsvParser('1,"hello world","with a, comma"', ',');

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
		const parser = new ext.CsvParser('1', ',');

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
		const parser = new ext.CsvParser("\"first\r\ncolumn\",second column", ',');

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
		const parser = new ext.CsvParser("a,b\r\nc,\"quoted\"", ',');

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
