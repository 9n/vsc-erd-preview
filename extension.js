
const vscode = require('vscode');
const VIEW_TYPE = 'erd-preview';
const { spawn } = require('child_process');
//const path = require('path');
var panels = {};
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let disposable = vscode.commands.registerCommand('extension.erdPreview', function () {
		if (isErdFileActive()) {
			showErdPreview();
		}
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(() => {
		var panel = null;
		if (isErdFileActive() && (panel = getErdPreview())) {
			setHtml(panel);
		}
	}));
}

function isErdFileActive() {
	if (vscode.window.activeTextEditor) {
		var fileName = vscode.window.activeTextEditor.document.fileName;
		return fileName && (fileName.endsWith('.erd') || fileName.endsWith('.er'));
	}
	return false;
}

function showErdPreview() {
	var viewColumn = vscode.window.activeTextEditor.viewColumn;
	if (viewColumn && viewColumn !== vscode.ViewColumn.Nine) {
		viewColumn++;
	}
	var panel = panels[viewColumn];
	if (!panel) {
		//var fileName = vscode.window.activeTextEditor.document.fileName;
		//path.basename(fileName)
		panel = vscode.window.createWebviewPanel(VIEW_TYPE, 'erd-preview', viewColumn);
		panel.onDidDispose(() => { panels[viewColumn] = null; });
		panels[viewColumn] = panel;
	}
	setHtml(panel);
}

function getErdPreview() {
	var viewColumn = vscode.window.activeTextEditor.viewColumn;
	if (viewColumn && viewColumn !== vscode.ViewColumn.Nine) {
		viewColumn++;
	}
	return panels[viewColumn];
}

function setHtml2(panel) {
	var text = vscode.window.activeTextEditor.document.getText();
	const child = spawn('erd', ['-f', 'svg']);
	child.on('error', function (e) {
		console.error(e);
		vscode.window.showErrorMessage(e.message);
	})
	child.stdin.write(text);
	child.stdin.end();
	child.stdout.setEncoding('utf8');
	var scriptOutput = '';
	var scriptError = '';
	child.stdout.on('data', function (data) {
		data = data.toString();
		scriptOutput += data;
	});
	child.stderr.on('data', function (data) {
		data = data.toString();
		scriptError += data;
	});
	child.on('close', function (code) {
		if (scriptError) {
			//vscode.window.showErrorMessage(scriptError);
		} else {
			panel.webview.html = scriptOutput;
		}
	});
}

function setHtml(panel) {
	var text = vscode.window.activeTextEditor.document.getText();
	const erdGo = spawn('erd-go');
	const dot = spawn('dot', ['-Tsvg']);
	erdGo.on('error', function (e) {
		console.error(e);
		vscode.window.showErrorMessage(e.message);
	});
	erdGo.stdout.pipe(dot.stdin);
	erdGo.stdin.write(text);
	erdGo.stdin.end();
	var scriptOutput = '';
	var scriptError = '';
	dot.stdout.on('data', function (data) {
		data = data.toString();
		scriptOutput += data;
	});
	dot.stderr.on('data', function (data) {
		data = data.toString();
		scriptError += data;
	});
	dot.on('close', function (code) {
		if (scriptError) {
			//vscode.window.showErrorMessage(scriptError);
		} else {
			panel.webview.html = scriptOutput;
		}
	});
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}

module.exports = {
	activate,
	deactivate
}
