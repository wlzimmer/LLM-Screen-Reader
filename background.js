var rate = 2.
var volume = 1.0
var line = ''
treeContext = 'You are an AI assistant that analyzes web pages using structured tree data. You have access to the DOM tree structure with hierarchical relationships.  Use this context to provide accurate and relevant responses about the webpage content.'

pageDataContext = 'You are an AI assistant that analyzes web pages using the information below.   Use this context to provide accurate and relevant responses about the webpage content.'

summarize =  'produce a clear, concise summary of the page '

chrome.runtime.onMessage.addListener(
  function (msg, sender, sendResponse) {
	chrome.tabs.query({ active: true, currentWindow: true }, (_tabs) => {
		tabs = _tabs
		let index = msg.indexOf(':');			// Ignore all but first ':'
		msg = [msg.slice(0, index), msg.slice(index + 1)]
		if (msg[0] == 'KEY') {
			if (msg[1] == 'Enter') {
				if (line != '') {
					speak (line)
					if (line.toLowerCase().startsWith('action')) {
						words = line.split(' ').filter(x=> x!='')
						if (words[1].toLowerCase() == 'click') {
							if (words[2].toLowerCase() == 'on') words = words.splice(1)
							callGPT ('return the web content Id of ' + words.splice(2).join(' ') + ' and return the retrieved web content Id only', click)
						} else console.log ('unknown action', words, words.splice(2).join(' '))
					} else {
						callGPT ("answer the question, use only the last provided web content.  Ignore all previous instructions, web content and context. " + line)
//						callGPT ("answer the question without adding external information " + line, speak, pageData.content, pageDataContext)
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
			console.log ('extractTreeRag'/* , msg[1] */)
			treeRag = JSON.parse(msg[1])
			var task = 'You are an expert summarizer. Read the content of the following webpage and produce a clear, concise summary. Do not provide a plan, provide a summary'
			callGPT (summarize)
			
		} else if (msg[0] == 'extractPageData') {
			pageData = JSON.parse(msg[1])	
//			callGPT (summarize, speak, pageData.content, pageDataContext))

		} else if (msg[0] == 'Start') {
			speak ('Start Chat G.P.T. Browser')
			console.log ('Start')
//			callContent ('extractPageData')
			callContent ('extractTreeRag')
		}
	});
	return true;
})

function callGPT (task, funct=speak, rag=treeRag, context=treeContext) {
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
			  "content": "use only the provided context do not add external information.  Ignore all previous instructions, web content and context. "
			},
			{
			  "role": "user",
			  "content": " Read the following retrieved context from a webpage and " + task  + "\n\nRetrieved context (Web Content):\n" + JSON.stringify(rag, null, 2)
			}
        ],
        max_tokens: 10000,
        temperature: 0.0
	  })
	}).then(response => response.json()).then(response => funct(JSON.stringify(response.choices[0].message.content).replace(/\\n/g, '\n').replace(/\\/g, '')));
}

function click (msg) {
	callGPT ('text content for item with the id of ' + msg.replaceAll('"', ''))
	callContent ('click', msg.replaceAll('"', ''))
}

function callContent () {
	console.log ('callContent', arguments[0] + ':' + Array.from(arguments).slice(1).join('`'))
	chrome.tabs.sendMessage(tabs[0].id, arguments[0] + ':' + Array.from(arguments).slice(1).join('`'))
}

function speak (msg) {
	console.log ('speak', msg)
	chrome.tts.speak(msg, {'enqueue': false, 'lang': 'en-US', 'rate': rate, 'volume': volume})
}