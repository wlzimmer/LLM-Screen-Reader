var rate = 1.5
var volume = 1.0
var line = ''

chrome.runtime.onMessage.addListener(
  function (msg, sender, sendResponse) {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		chrome.tabs.sendMessage(tabs[0].id, msg);
			
		if (msg != 'Enter') {
//			speak (msg)
			if (msg == 'Backspace') {
				line = line.slice(-1)
			} else {
				line += msg
			}
		} else {
			var API_KEY = "sk-*****", {
			  method: "POST",
			  headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${API_KEY}`
			  },
			  body: JSON.stringify({
				model: "gpt-4.1-nano",
				messages: [{ role: "user", content: line }]
			  })
			}).then(response => response.json()).then(response => speak(JSON.stringify(response.choices[0].message.content)));
		}
	});
	return true;
})

function speak (msg) {
	chrome.tts.speak(msg, {'enqueue': true, 'lang': 'en-US', 'rate': rate, 'volume': volume})
}