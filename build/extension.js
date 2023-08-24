// Built using vscode-ext
const vscode = require("vscode")
const spawn = require("child_process").spawn
const path = require("path")
const pythonPath = path.join(__dirname, "extension.py")
const requirements = path.join(__dirname, "../requirements.txt")
const osvar = process.platform

buttons = {}

if (osvar == "win32") {
  spawn("python", ["-m", "pip", "install", "-r", requirements])
} else {
  spawn("python3", ["-m", "pip3", "install", "-r", requirements])
}

function executeCommands(pythonProcess, data, globalStorage) {
  let ogdata = data.toString()
  data = ogdata.split("\n")
  let debug = data.slice(0, data.length - 1)
  data = data[data.length - 1]
  try {
    data = JSON.parse(data)
    code = data.code
    if (!code) {
      throw Error
    }
    args = data.args
  } catch {
    return console.log("Debug message from extension.py: " + ogdata)
  }
  if (debug.length > 0) {
    console.log("Debug message from extension.py: " + debug)
  }
  pythonProcess.send_ipc = function (msg) {
    this.stdin.write(JSON.stringify(msg) + "\n")
  }
  switch (code) {
    case "SM":
      vscode.window[args[0]](...args.slice(1)).then((r) =>
        pythonProcess.send_ipc(r)
      )
      break
    case "QP":
      vscode.window
        .showQuickPick(args[0], args[1])
        .then((r) => pythonProcess.send_ipc(r))
      break
    case "IB":
      vscode.window
        .showInputBox(args[0])
        .then((s) => pythonProcess.send_ipc(s))
      break
    case "OE":
      vscode.env.openExternal(args[0])
      break
    case "EP":
      pythonProcess.send_ipc(vscode.env[args[0]])
      break
    case "GC":
      pythonProcess.send_ipc(
        vscode.workspace.getConfiguration(args[0]).get(args[1])
      )
      break
    case "BM":
      let dis
      if (args.length > 1) {
        dis = vscode.window.setStatusBarMessage(args[0], args[1])
      } else {
        dis = vscode.window.setStatusBarMessage(args[0])
      }
      let id = "id" + Math.random().toString(16).slice(2)
      globalStorage[id] = dis
      pythonProcess.send_ipc(id)
      break
    case "DI":
      globalStorage[args[0]].dispose()
      return pythonProcess.send_ipc(args[0])
    case "AT":
      pythonProcess.send_ipc(vscode.window.activeTextEditor)
      break
    case "GT":
      let editor = vscode.window.activeTextEditor
      let res
      if (!editor) {
        res = undefined
      } else if (args.length > 0) {
        let {
          start,
          end
        } = JSON.parse(args[0])
        let range = new vscode.Range(
          start.line,
          start.character,
          end.line,
          end.character
        )
        res = editor.document.getText(range)
      } else {
        res = editor.document.getText()
      }
      pythonProcess.send_ipc(res)
      break
    case "EE":
      let {
        start, end
      } = JSON.parse(args[0])
      let range = new vscode.Range(
        start.line,
        start.character,
        end.line,
        end.character
      )
      if (!vscode.window.activeTextEditor) {
        return pythonProcess.stdin.write("undefined\n")
      }
      vscode.window.activeTextEditor
        .edit((editB) => {
          editB.replace(range, args[1])
        })
        .then((s) => pythonProcess.send_ipc(s))
      break
    case "LA":
      if (!vscode.window.activeTextEditor) {
        return pythonProcess.stdin.write("undefined\n")
      }
      let cline = vscode.window.activeTextEditor.document.lineAt(
        parseInt(args[0])
      )
      return pythonProcess.send_ipc(cline)
    case "ST":
      vscode.window
        .showTextDocument(vscode.Uri.file(args[0]), args[1])
        .then((s) => pythonProcess.send_ipc(s))
      break
    case "CW":
      globalStorage[args[0]] = new Webview(pythonProcess, ...args.slice(1))
      return pythonProcess.send_ipc(args[0])
    case "WB":
      globalStorage[args[0]].executeCommands(args[1])
      break
    default:
      console.log("Couldn't parse this: " + data)
  }
}

class Webview {
  constructor(pythonProcess, viewType, name, column, options) {
    this.pythonProcess = pythonProcess
    this.panel = vscode.window.createWebviewPanel(
      viewType,
      name,
      column || vscode.ViewColumn.One,
      options
    )
    this.disposables = []

    // Add listeners here
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables)
    // this.panel.webview.onDidReceiveMessage((msg) => {
    //   this.pythonProcess.send_ipc({ name: "onDidReceiveMessage", msg })
    // })
  }
  executeCommands(data) {
    switch (data.code) {
      case "SET-HTML":
        this.panel.webview.html = data.args[0]
        this.pythonProcess.send_ipc(true)
        break
      case "SET-TITLE":
        this.panel.title = data.args[0]
        this.pythonProcess.send_ipc(true)
        break
      case "POST-MSG":
        this.panel.webview
          .postMessage(data.args[0])
          .then((s) => this.pythonProcess.send_ipc(s))
        break
      case "DISPOSE":
        this.dispose()
    }
  }
  dispose() {
    this.panel.dispose()
  }
}

function activate(context) {
  let globalStorage = {}
  console.log("The Extension 'mediaManager' has started")
  let pause = vscode.commands.registerCommand('mediaManager.pause', async function () {
    let funcName = "pause"
    let pyVar = "python"
    let py = spawn(pyVar, [pythonPath, funcName])

    py.stdout.on("data", (data) => {
      try {
        updateInfo(data)
      } catch (e) {
        console.error(e)
      }
    })
    py.stderr.on("data", (data) => {
      console.error(`An Error occurred in the python script: ${data}`)
    })
  })
  context.subscriptions.push(pause)
  let previousMedia = vscode.commands.registerCommand('mediaManager.previousMedia', async function () {
    let funcName = "previous_media"
    let pyVar = "python"
    let py = spawn(pyVar, [pythonPath, funcName])

    py.stdout.on("data", (data) => {
      try {
        updateInfo(data)
      } catch (e) {
        console.error(e)
      }
    })
    py.stderr.on("data", (data) => {
      console.error(`An Error occurred in the python script: ${data}`)
    })
  })
  context.subscriptions.push(previousMedia)
  let nextMedia = vscode.commands.registerCommand('mediaManager.nextMedia', async function () {
    let funcName = "next_media"
    let pyVar = "python"
    let py = spawn(pyVar, [pythonPath, funcName])

    py.stdout.on("data", (data) => {
      try {
        updateInfo(data)
      } catch (e) {
        console.error(e)
      }
    })
    py.stderr.on("data", (data) => {
      console.error(`An Error occurred in the python script: ${data}`)
    })
  })
  context.subscriptions.push(nextMedia)
  let getInfo = vscode.commands.registerCommand('mediaManager.getInfo', async function () {
    let funcName = "get_info"
    let pyVar = "python"
    let py = spawn(pyVar, [pythonPath, funcName])

    py.stdout.on("data", (data) => {
      try {
        updateInfo(data)
      } catch (e) {
        console.error(e)
      }
    })
    py.stderr.on("data", (data) => {
      console.error(`An Error occurred in the python script: ${data}`)
    })
  })
  context.subscriptions.push(getInfo)
  createStatusBarItem()
  setInterval(() => {
    vscode.commands.executeCommand('mediaManager.getInfo')
  }, 1000)
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
}

function updateInfo(info) {
  info = JSON.parse(info.toString()).args[1].split(" ☼ ")

  buttons['Song'].text = info[0]
  buttons['Artist'].text = info[1]
  buttons['Album'].text = info[2]

  if(info[3] == "PLAYING")
  {
    buttons['PlayPause'].text = "$(debug-pause)"
    buttons['PlayPause'].tooltip = "Pause"
  }
  else
  {
    buttons['PlayPause'].text = "$(triangle-right)"
    buttons['PlayPause'].tooltip = "Play"
  }
}

function createStatusBarItem() {
  item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1)
  item.text = "Song"
  item.tooltip = "Song"
  item.show()

  buttons['Song'] = item

  item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1)
  item.text = "Artist"
  item.tooltip = "Artist"
  item.show()

  buttons['Artist'] = item

  item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1)
  item.text = "Album"
  item.tooltip = "Album"
  item.show()

  buttons['Album'] = item

  item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1)
  item.text = "$(chevron-left)"
  item.command = "mediaManager.previousMedia"
  item.tooltip = "Previous song"
  item.show()

  buttons['Previous'] = item

  item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1)
  item.text = "$(triangle-right)"
  item.command = "mediaManager.pause"
  item.tooltip = "Pause"
  item.show()

  buttons['PlayPause'] = item

  item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1)
  item.text = "$(chevron-right)"
  item.command = "mediaManager.nextMedia"
  item.tooltip = "Next song"
  item.show()

  buttons['Next'] = item
}