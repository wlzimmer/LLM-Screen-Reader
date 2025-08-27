var rate = 1.5
var volume = 1.0
chrome.runtime.onMessage.addListener(
  function (msg, sender, sendResponse) {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		chrome.tabs.sendMessage(tabs[0].id, msg);
		chrome.tts.speak(msg, {'enqueue': true, 'lang': 'en-US', 'rate': rate, 'volume': volume})
		console.log ('fubar')
		var API_KEY = "sk-***************"
			console.log (`Bearer ${API_KEY}`)
			fetch("https://api.openai.com/v1/chat/completions", {
			  method: "POST",
			  headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${API_KEY}`
			  },
			  body: JSON.stringify({
				model: "gpt-4.1-nano",
				messages: [{ role: "user", content: "how many eggs in a dozen" }]
			  })
			}).then(response => response.json()).then(response => console.log(JSON.stringify(response)));
	});
	return true;
})

