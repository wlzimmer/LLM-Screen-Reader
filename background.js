var rate = 1.5
var volume = 1.0
var line = ''

chrome.runtime.onMessage.addListener(
  function (msg, sender, sendResponse) {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		let index = msg.indexOf(':');			// Ignore all but first ':'
		msg = [msg.slice(0, index), msg.slice(index + 1)]
//		console.log ('msg', msg)
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
					callContext (tabs, 'log', msg[1])
					callGPT ([{ role: "user", content: line }])
					line = ''
				} else speak ("stop")
					
			}
		} else if (msg[0] == 'extractPageData') {
//			console.log ('extractPageData', msg[1])
			var pageData = JSON.parse(msg[1])
			console.log ('pageData.content', pageData.content)
			var content = JSON.stringify(pageData.content, null, 2)
			console.log ('content', content)
			var task = 'You are an expert summarizer. Read the content of the following webpage and produce a clear, concise summary. Do not provide a plan, provide a summary'
			const messages = [
			  /* {
				role: 'system',
				content: `You are a web automation assistant. Analyze the provided HTML content and determine how to accomplish the given task. Provide specific instructions for interacting with the page elements. Do not comment on this request, just provide the information`
			  }, */
			  {
				role: 'user',
				content: `Page content: ${pageData.content.substring(0, 5000)}\n\nTask: ${task}`
			  }
			];

			callGPT(messages);
		} else if (msg[0] == 'Start') {
			console.log ('Start')
			callContext (tabs, 'extractPageData')
		}
	});
	return true;
})

function callGPT (prompt) {
	var API_KEY = "sk-*****"
	console.log ('final', line)
	fetch("https://api.openai.com/v1/chat/completions", {
	  method: "POST",
	  headers: {
		"Content-Type": "application/json",
		"Authorization": `Bearer ${API_KEY}`
	  },
	  body: JSON.stringify({
		model: "gpt-4.1-nano",
		messages: prompt,
        max_tokens: 10000,
        temperature: 0.7
	  })
	}).then(response => response.json()).then(response => speak(JSON.stringify(response.choices[0].message.content).replace(/\\n/g, '\n').replace(/\\/g, '')));
}

function callContext () {	
	chrome.tabs.sendMessage(arguments[0][0].id, arguments[1] + ':' + Array.from(arguments).slice(2).join('`'))
}

function speak (msg) {
	console.log ('speak', msg)
	chrome.tts.speak(msg, {'enqueue': true, 'lang': 'en-US', 'rate': rate, 'volume': volume})
}