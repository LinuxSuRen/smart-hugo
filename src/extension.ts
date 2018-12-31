// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
const path = require('path')
const spawn = require('child_process').spawn;
const opn = require('opn');
const os = require('os')

const newPost = () => {
	console.log("i'm here")
	vscode.window.showInputBox({ placeHolder: 'Enter filename' }).then((filename) => {
		var textEditor = vscode.window.activeTextEditor;
		if( textEditor ){
			var filePath = textEditor.document.fileName;
			filePath = path.dirname(filePath)
			const newPostPath = path.join(filePath, filename + '.md');
			const postPath = newPostPath
			console.log(newPostPath)
			vscode.window.showInformationMessage(newPostPath)
			const newPostCmd = spawn('hugo', ['new', postPath, `-s="${vscode.workspace.rootPath}"`], { shell: true });
			newPostCmd.stdout.on('data', (data) => {
				vscode.window.showInformationMessage(data);
			});
			newPostCmd.stderr.on('data', (data) => {
				console.log(`stderr: ${data}`);
				vscode.window.showInformationMessage(`Error creating new post.`);
			});
			newPostCmd.on('close', (code) => {
				if (code === 0) {
					let uripath = vscode.Uri.file(newPostPath);
					vscode.workspace.openTextDocument(uripath).then((document) => {
						vscode.window.showTextDocument(document);
					}, err => {
						console.log(err);
					});
				} else {
					vscode.window.showErrorMessage(`Error creating new post.`);
				}
			});
		}
	})
}

const build = () => {
    const buildCmd = spawn('hugo', ['--buildDrafts', `-s="${vscode.workspace.rootPath}"`], { shell: true });
    buildCmd.stdout.on('data', (data) => {
        console.log(`std ${data}`);
        vscode.window.showInformationMessage(data.toString());
    });

    buildCmd.stderr.on('data', (data) => {
        console.log(`stderr ${data}`);
        vscode.window.showErrorMessage(data.toString());
    });

    buildCmd.on('close', (code) => {
        console.log(`code ${code}`);
        if (code !== 0) {
            vscode.window.showErrorMessage('Error getting hugo version, Make sure hugo is available in path.');
        }
    });
};

let startCmd;
const startServer = () => {
	startCmd = spawn('hugo', ['server', `-s="${vscode.workspace.rootPath}"`, '--buildDrafts', '--watch', '--port=9081'], { shell: true });
    startCmd.stdout.on('data', (data) => {
        if (data.indexOf('Building sites') > -1) {
            opn('http://localhost:9081');
        }

        console.log(`stdout: ${data}`);
    });

    startCmd.stderr.on('data', (data) => {
        console.log(data.toString());
        vscode.window.showErrorMessage(`Error running server`);
    });

    startCmd.on('close', (code) => {
        console.log('Command close, code = ', code);
    });
};

const stopServer = () => {
    if (startCmd) {
        if (os.platform() == 'win32') {
            spawn("taskkill", ["/pid", startCmd.pid, '/f', '/t']);
        }
        else {
            startCmd.kill('SIGTERM');
        }
    } else {
        console.log('No process started');
    }
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
		console.log('Congratulations, your extension "hugo" is now active!');

	context.subscriptions.push(
		vscode.commands.registerCommand('hugo.newPost', newPost),
		vscode.commands.registerCommand('hugo.server', startServer),
		vscode.commands.registerCommand('hugo.stopServer', stopServer),
		vscode.commands.registerCommand('hugo.build', build));
}

// this method is called when your extension is deactivated
export function deactivate() {}
