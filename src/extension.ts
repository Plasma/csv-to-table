// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import CsvParser from './CsvParser';
import TableWriter from './TableWriter';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(registerCsvToTableCommand(',', 'extension.csv-to-table.csv'));
	context.subscriptions.push(registerCsvToTableCommand('\t', 'extension.csv-to-table.tsv'));
	context.subscriptions.push(registerCsvToTableCommand('|', 'extension.csv-to-table.psv'));
	context.subscriptions.push(registerCsvToTableCommand(';', 'extension.csv-to-table.ssv'));
}

/**
 * Helper method to register different commands
 * @param separator Separator to register
 * @param commandName Name of the command we are registering
 */
function registerCsvToTableCommand(separator: string, commandName: string): vscode.Disposable {
	let disposable = vscode.commands.registerCommand(commandName, async function () {
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
			// Determine if we are going to replace current content, or open a new window
			const settings = vscode.workspace.getConfiguration('csv-to-table');
			if (settings.openGeneratedTableInNewEditor) {
				// Open new window
				const newDoc = await vscode.workspace.openTextDocument({
					content: formattedResult
				});
				vscode.window.showTextDocument(newDoc, vscode.ViewColumn.Active);
			} else {
				// Edit existing window
				editor.edit(editBuilder => {
					editBuilder.replace(selection, formattedResult);
				});
			}
		}
	});

	return disposable;
}

// this method is called when your extension is deactivated
export function deactivate() {}
