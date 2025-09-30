var rate = 2.
var volume = 1.0
var line = ''
treeContext = "Ignore all previous instructions and context.  You are an AI assistant that analyzes web pages using structured tree data. You have access to the DOM tree structure with hierarchical relationships. Follow the nested structure of the tree exactly. Ignore any previous DOM Tree structure, use only the current DOM Tree.  Do not add extra fields beyond what is in the tree. Use this context to provide accurate and relevant responses about the webpage content. "

summarize =  'produce a clear, concise summary of the page '

chrome.runtime.onMessage.addListener(
  function (msg, sender, sendResponse) {
	chrome.tabs.query({ active: true, currentWindow: true }, (_tabs) => {
		tabs = _tabs
		let index = msg.indexOf(':');			// Ignore all but first ':'
		msg = [msg.slice(0, index), msg.slice(index + 1)]
		if (msg[0] == 'KEY') {
			if (msg[1] == 'Enter') {
//				callContent ('extractTreeRag')
				if (line != '') {
					speak (line)
					console.log ('startswith', line.toLowerCase().startsWith('click'))
					if (line.toLowerCase().startsWith('click')) {
						deleteTreeRAG (treeRag, (n=> !n.Clickable))
//						showTreeRAG(treeRag)
						words = line.split(' ').filter(x=> x!='')
							if (words[1].toLowerCase() == 'on') words = words.splice(1)
							callGPT ('You are a web assistant looking for the Id of an element with TextContent that contains the most of the words \"' + words.splice(1).join(' ') + '\". If, in addition to the element, the command has a value, set the value in your response, otherwise set the value to blank. Rate your confidence in your answer on a scale from 0–100%. Base this rating only on how explicitly the information is stated in the provided text. If the information is not mentioned in the text, return Confidence: 0% Output in a pure JSON object with a the properties Id, value and Confidence. response_format={"type":"json_object"}.  Do NOT wrap JSON in quotes. Do NOT use markdown code fences (no ```json).  If data is missing, set the field value to "" (empty string).  Do not explain. ', actionClick)
						
						/* Do NOT wrap JSON in quotes. Do NOT use markdown code fences (no ```json). */
					} else {
						callGPT ("answer the question, " + line)
					}
					line = ''
				} else chrome.tts.stop();
			} else if (msg[1] == 'Backspace') {
				speak ('backspace ' + (line.slice(-1)==' '?'space':line.slice(-1)))
//					speak ('backspace ' + line.slice(-1))
				line = line.slice(0,-1)
			} else if (msg[1].length == 1) {
				line += msg[1]
				speak (msg[1]==' '?'space':msg[1])
			}
		} else if (msg[0] == 'extractTreeRag') {
			console.log ('extractTreeRag')
			treeRag = JSON.parse(msg[1])
			
		} else if (msg[0] == 'Start') {
			speak ('Start Chat G.P.T. Browser')
			console.log ('Start')
			callContent ('extractTreeRag')
		}
	});
	return true;
})

function callGPT (task, funct=speak, rag=treeRag, systemContext=treeContext) {
	var API_KEY = "sk-*****"
	console.log (task)
	fetch("https://api.openai.com/v1/chat/completions", {
	  method: "POST",
	  headers: {
		"Content-Type": "application/json",
		"Authorization": `Bearer ${API_KEY}`
	  },
	  body: JSON.stringify({
		model: "gpt-4.1-nano",
		messages: [
			{
			  "role": "system",
			  "content": systemContext + "\n\nWeb Content Tree:\n" + JSON.stringify(rag, null, 2)

			},
			{
			  "role": "user",
			  "content": task
			}
        ],
        max_tokens: 10000,
        temperature: 0.0
	  })
	}).then(response => response.json()).then(response => funct(JSON.stringify(response.choices[0].message.content).replace(/\\n/g, '\n').replace(/\\/g, '')));
}

function actionClick (msg) {
	console.log (msg)
	let cmd = JSON.parse(msg.trim().slice(1, -1))
	console.log ('cmd=' + JSON.stringify(cmd))
	callContent ('click', cmd.Id)
}

function action (msg) {
	console.log (msg)
	let cmd = JSON.parse(msg.trim().slice(1, -1))
	console.log ('cmd=' + JSON.stringify(cmd))
	if (cmd.action == 'click') callContent ('click', cmd.Id)
	else if (cmd.action == 'input') callContent ('putValue', cmd.Id, cmd.value)
	else if (cmd.action == 'back') callContent ('prevURL')
	else speak (cmd.action + ' not recognized as a command')
	
//	callGPT ('text content for item with the id of ' + msg.replaceAll('"', ''))
//	callContent ('click', msg.replaceAll('"', ''))
}

function callContent () {
	console.log ('callContent', arguments[0] + ':' + Array.from(arguments).slice(1).join('`'))
	chrome.tabs.sendMessage(tabs[0].id, arguments[0] + ':' + Array.from(arguments).slice(1).join('`'))
}

function afterAction (msg) {
	var lines = msg.split ('\n')
	var confidence = parseInt(lines[2].split(' ')[1])
	if (lines[2] == '0%' || confidence < 70) {
		speak ('Try rephrasing your request')
	} else {
		speak (line[0])
		let cmd = JSON.parse(msg.trim().slice(1, -1))
		if (cmd.action == 'click_on_element') console.log ('click', cmd.Id)
		else if (cmd.action == 'input_into') console.log ('putValue', cmd.Id, cmd.value)
		else if (cmd.action == 'previous_page') console.log ('prevURL')
		else speak (cmd.action + ' not recognized as a command')
	}
}

function deleteTreeRAG (node, funct) {
	if (funct(node)) {
//		console.log('deleteTreeRAG', node.Id, node.Clickable, node.TextContent)
		node.Clickable = false, 
		node.Field = false,
		node.Heading = false,
		node.Value = '',
		node.TextContent = ''
	} //else console.log('keep', node.Id, node.Clickable, node.TextContent)
	node.Children.forEach (n=> deleteTreeRAG(n, funct))
}

function showTreeRAG (node) {
	console.log ('showTreeRAG', node.Id, node.Clickable, node.TextContent)
	node.Children.forEach (n=> showTreeRAG(n))
}

function speak (msg) {
	console.log ('speak', msg)
	chrome.tts.speak(msg, {'enqueue': false, 'lang': 'en-US', 'rate': rate, 'volume': volume})
}