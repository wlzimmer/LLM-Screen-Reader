var rate = 2.
var volume = 1.0
var line = ''
treeContext = 'You are an AI assistant that analyzes web pages using structured tree data. You have access to the DOM tree structure with hierarchical relationships.  Use this context to provide accurate and relevant responses about the webpage content.'

pageDataContext = 'You are an AI assistant that analyzes web pages using the information below.   Use this context to provide accurate and relevant responses about the webpage content.'

summarize =  'produce a clear, concise summary of the page '

chrome.runtime.onMessage.addListener(
  function (msg, sender, sendResponse) {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		let index = msg.indexOf(':');			// Ignore all but first ':'
		msg = [msg.slice(0, index), msg.slice(index + 1)]
		console.log ('msg', msg)
		if (msg[0] == 'KEY') {
			if (msg[1] != 'Enter') {
//			speak (msg[1])
				if (msg[1] == 'Backspace') {
					line = line.slice(0,-1)
				} else {
					line += msg[1]
				}
				console.log ('line', line)
			} else {
				if (line != '') {
					callGPT (treeRag, treeContext, "answer the question" + line)
//					callGPT (pageData.content, pageDataContext, "answer the question" + line)
					line = ''
				} else speak ("stop")
					
			}
		} else if (msg[0] == 'extractTreeRag') {
			console.log ('extractTreeRag'/* , msg[1] */)
			treeRag = JSON.parse(msg[1])
			var task = 'You are an expert summarizer. Read the content of the following webpage and produce a clear, concise summary. Do not provide a plan, provide a summary'
			callGPT (treeRag, treeContext, summarize)
			
		} else if (msg[0] == 'extractPageData') {
			pageData = JSON.parse(msg[1])	
//			callGPT (pageData.content, pageDataContext, summarize)

		} else if (msg[0] == 'Start') {
			speak ('Start Chat G.P.T. Browser')
			console.log ('Start')
//			callContext (tabs, 'extractPageData')
			callContext (tabs, 'extractTreeRag')
		}
	});
	return true;
})

function callGPT (rag, context, task) {
	var API_KEY = "sk*****"
	console.log ('final', " Read the following retrieved context from a webpage and " + task  + "\n\nRetrieved context (Web Content):\n" )
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
			  "content": "Ignore all previous instructions and context. "
			},
			{
			  "role": "user",
			  "content": " Read the following retrieved context from a webpage and " + task  + "\n\nRetrieved context (Web Content):\n" + JSON.stringify(rag, null, 2)
			}
        ],
        max_tokens: 10000,
        temperature: 0.7
	  })
	}).then(response => response.json()).then(response => speak(JSON.stringify(response.choices[0].message.content).replace(/\\n/g, '\n').replace(/\\/g, '')));
}

function callContext () {
	console.log ('callContext', arguments[1])
	chrome.tabs.sendMessage(arguments[0][0].id, arguments[1] + ':' + Array.from(arguments).slice(2).join('`'))
}

function speak (msg) {
	sentences = msg.split('. ')
	for (sentence of sentences) {
		console.log ('speak', msg)
		chrome.tts.speak(msg, {'enqueue': true, 'lang': 'en-US', 'rate': rate, 'volume': volume})
	}
}