var rate = 2.
var volume = 1.0
var line = ''
var lastId = 0
task0 = 'You are a web assistant looking for the Id of an element with TextContent that contains the most of the words \"'

task1 = '\". If, in addition to the element, the command has a value, set the value in your response, otherwise set the value to blank. Rate your confidence in your answer on a scale from 0–100%. Base this rating only on how explicitly the information is stated in the provided text. If the information is not mentioned in the text, return Confidence: 0% Output in a pure JSON object with a the properties Id, value and Confidence. response_format={"type":"json_object"}.  Do NOT wrap JSON in quotes. Do NOT use markdown code fences (no ```json).  If data is missing, set the field value to "" (empty string).  Do not explain. '
summarize =  'produce a clear, concise summary of the page '

chrome.runtime.onMessage.addListener(
  function (msg, sender, sendResponse) {
	chrome.tabs.query({ active: true, currentWindow: true }, (_tabs) => {
		tabs = _tabs
		let index = msg.indexOf(':');			// Ignore all but first ':'
		msg = [msg.slice(0, index), msg.slice(index + 1)]
		if (msg[0] == 'KEY') {
			if (msg[1] == 'Enter') {
				callContent ('extractTreeRag')
				if (line != '') {
					speak (line)
					var words = line.split(' ').filter(x=> x!='').slice(1)
					console.log ('startswith', line.toLowerCase().startsWith('click'))
					if (line.toLowerCase().startsWith('click')) {
						deleteTreeRAG (treeRag, (n=> !n.Clickable))
//						showTreeRAG(treeRag)
						if (words[0].toLowerCase() == 'on') words = words.splice(1)
						ragGPT (task0 + words.join(' ') + task1, actionClick)
						
					} else if (line.toLowerCase().startsWith('input')) {
						deleteTreeRAG (treeRag, (n=> !n.FormField))
						if (words[0].toLowerCase() == 'on') words = words.splice(1)
						ragGPT (task0 + words.join(' ') + task1, actionInput)
						
					} else if (line.toLowerCase().startsWith('find')) {
						var texts = ["send email to Alice","schedule a meeting tomorrow","remind me to buy milk"]
						var body = {
							  model: "text-embedding-3-small", // ✅ must be an embedding model
							  input: texts
							}
						callGPT (body, data => console.log (data.data.map(item => item.embedding)), "https://api.openai.com/v1/embeddings")
									
					} else if (line.toLowerCase().startsWith('back')) {
						callContent ('prevURL')
						
					} else if (line.toLowerCase().startsWith('page')) {
						callContent ('newURL', words.join(' '))
						
//					} else if (line.toLowerCase().startsWith('click')) {
					} else {
						ragGPT ("answer the question, " + line)
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

function ragGPT (line, funct=actionSpeak, rag=treeRag) {
	console.log (line)
//	rag = '**RAG**'
	var body = {
		model: "gpt-4.1-nano", 
		messages: [
			{
			  "role": "system",
			  "content": "Ignore all previous instructions and context.  You are an AI assistant that analyzes web pages using structured tree data. You have access to the DOM tree structure with hierarchical relationships. Follow the nested structure of the tree exactly. Ignore any previous DOM Tree structure, use only the current DOM Tree.  Do not add extra fields beyond what is in the tree. Use this context to provide accurate and relevant responses about the webpage content. " + "\n\nWeb Content Tree:\n" + JSON.stringify(rag, null, 2)
			},
			{
			  "role": "user",
			  "content": line
			}
        ],
        max_tokens: 10000,
        temperature: 0.0
	}
	console.log (body)
	callGPT (body, funct, "https://api.openai.com/v1/chat/completions")
}

function callGPT (body, funct, endpoint) {
	var API_KEY = "sk-*****"
	fetch(endpoint, {
	  method: "POST",
	  headers: {
		"Content-Type": "application/json",
		"Authorization": `Bearer ${API_KEY}`
	  },
	  body: JSON.stringify(body)
	}).then(response => response.json()).then(response => funct(response));
}
//.replace(/\\n/g, '\n').replace(/\\/g, '')

function actionClick (msg) {
	let cmd = parseAction (msg)
	if (!cmd) return
	callContent ('click', cmd.Id)
}

function actionInput (msg) {
	let cmd = parseAction (msg)
	if (!cmd) return
	callContent ('putValue', cmd.Id, cmd.value)
}

function callContent () {
	console.log ('callContent', arguments[0] + ':' + Array.from(arguments).slice(1).join('`'))
	chrome.tabs.sendMessage(tabs[0].id, arguments[0] + ':' + Array.from(arguments).slice(1).join('`'))
}

function parseAction (response) {
	console.log (response.choices[0].message.content)
	let cmd = JSON.parse(response.choices[0].message.content)
	let confidence = parseInt(cmd.Confidence)
	let textContent = selectTree(treeRag, (n=> n.Id == cmd.Id)).map(n=> n.TextContent)
	console.log ('textContent', textContent)
	if (confidence == 0 || confidence < 70 || textContent.length != 1) {
		speak ('Try rephrasing your request')
		return null
	}
	lastId = cmd.Id
	speak (textContent[0])
	return cmd
}

function actionSpeak (response) {
	speak (JSON.stringify(response.choices[0].message.content))
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

function selectTree (node, funct, result=[]) {
	if (funct(node)) result.push(node)
	node.Children.map(child => result = selectTree(child,  funct, result));
	return result
}

function speak (msg) {
	console.log ('speak', msg)
	chrome.tts.speak(msg, {'enqueue': false, 'lang': 'en-US', 'rate': rate, 'volume': volume})
}